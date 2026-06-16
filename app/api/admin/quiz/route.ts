import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { kstToday } from '@/lib/quiz'

// "YYYY-MM-DD" → 다음 날 (달력 산술, 타임존 무관). 정오 UTC 앵커로 경계 안전.
const pad = (n: number) => String(n).padStart(2, '0')
const nextCalendarDay = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const requireAdmin = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.', status: 401 as const }
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return { error: '관리자만 접근할 수 있어요.', status: 403 as const }
  return { user }
}

// 비축 잔량 + 예정 문항 목록 (오늘 포함 이후).
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = await createServiceClient()
  const { data: items } = await service
    .from('quiz_items')
    .select('id, question, correct_answer, explanation, publish_date')
    .gte('publish_date', kstToday())
    .order('publish_date', { ascending: true })

  return NextResponse.json({ stock: items?.length ?? 0, items: items ?? [] })
}

interface IncomingItem {
  question: string
  correct_answer: string
  explanation: string
}

// 배치 등록 — 외부 AI로 만든 문항 묶음을 시작일부터 빈 날짜에 순차 배정.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { start_date, items } = await request.json()

    // 시작일은 선택값 — 없으면 오늘(KST)부터. 빈 날짜에 순서대로 이어붙는다(아래 skip 로직).
    const startDate = start_date && /^\d{4}-\d{2}-\d{2}$/.test(start_date) ? start_date : kstToday()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '등록할 문항이 없어요.' }, { status: 400 })
    }

    // 검수: 각 문항 형식 확인
    for (const [i, it] of (items as IncomingItem[]).entries()) {
      if (!it?.question?.trim() || !it?.explanation?.trim()) {
        return NextResponse.json({ error: `${i + 1}번 문항: 질문과 해설은 필수예요.` }, { status: 400 })
      }
      if (it.correct_answer !== 'O' && it.correct_answer !== 'X') {
        return NextResponse.json({ error: `${i + 1}번 문항: 정답은 O 또는 X여야 해요.` }, { status: 400 })
      }
    }

    const service = await createServiceClient()

    // 시작일 이후 이미 점유된 게시일 — 그 날짜는 건너뛴다.
    const { data: existing } = await service
      .from('quiz_items')
      .select('publish_date')
      .gte('publish_date', startDate)
    const taken = new Set((existing ?? []).map(e => e.publish_date))

    let cursor = startDate
    const rows = (items as IncomingItem[]).map(it => {
      while (taken.has(cursor)) cursor = nextCalendarDay(cursor)
      const publish_date = cursor
      taken.add(cursor)
      cursor = nextCalendarDay(cursor)
      return {
        question: it.question.trim(),
        correct_answer: it.correct_answer,
        explanation: it.explanation.trim(),
        publish_date,
      }
    })

    const { error: insertError } = await service.from('quiz_items').insert(rows)
    if (insertError) {
      console.error('Quiz batch insert error:', insertError)
      return NextResponse.json({ error: '문항 등록에 실패했어요.' }, { status: 500 })
    }

    return NextResponse.json(
      { count: rows.length, from: rows[0].publish_date, to: rows[rows.length - 1].publish_date },
      { status: 201 }
    )
  } catch (err) {
    console.error('Admin quiz route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
