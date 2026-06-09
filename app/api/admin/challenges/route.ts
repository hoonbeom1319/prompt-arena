import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있어요.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      instruction,
      model_name,
      temperature,
      wrapper_text,
      submission_date,
    } = body

    if (!title || !instruction || !submission_date) {
      return NextResponse.json({ error: '필수 필드가 누락됐어요.' }, { status: 400 })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(submission_date)) {
      return NextResponse.json({ error: '제출일 형식이 올바르지 않아요.' }, { status: 400 })
    }

    // 제출일 하나로 주간 사이클 전체를 파생한다 (로컬 시간 기준).
    // 제출일: 종일 / 투표: 다음 날 종일 / 결과: 그 다음 날부터 자동 (voting_end 이후).
    const addDays = (d: Date, n: number) => {
      const x = new Date(d)
      x.setDate(x.getDate() + n)
      return x
    }
    const endOfDay = (d: Date) => {
      const x = new Date(d)
      x.setHours(23, 59, 59, 0)
      return x
    }

    const submissionStart = new Date(`${submission_date}T00:00:00`)
    const votingStart = addDays(submissionStart, 1)

    const serviceSupabase = await createServiceClient()

    const { data: challenge, error: insertError } = await serviceSupabase
      .from('challenges')
      .insert({
        title,
        instruction,
        model_name: model_name || 'gemini-2.5-flash',
        temperature: temperature || 0.7,
        wrapper_text: wrapper_text || null,
        submission_start_at: submissionStart.toISOString(),
        submission_end_at: endOfDay(submissionStart).toISOString(),
        voting_start_at: votingStart.toISOString(),
        voting_end_at: endOfDay(votingStart).toISOString(),
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Challenge insert error:', insertError)
      return NextResponse.json({ error: '챌린지 생성에 실패했어요.' }, { status: 500 })
    }

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (err) {
    console.error('Admin challenges route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
