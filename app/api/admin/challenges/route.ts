import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateSchedule, type ScheduleTimes } from '@/lib/challenge-schedule'

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
      submission_start_at,
      submission_end_at,
      voting_start_at,
      voting_end_at,
    } = body

    if (!title || !instruction) {
      return NextResponse.json({ error: '제목과 설명은 필수예요.' }, { status: 400 })
    }

    // 일정: 4시각을 직접 받으면 그대로 쓰고, 없으면 제출일 하나로 2일 주기를 파생한다.
    let schedule: ScheduleTimes
    if (submission_start_at && submission_end_at && voting_start_at && voting_end_at) {
      schedule = { submission_start_at, submission_end_at, voting_start_at, voting_end_at }
    } else if (submission_date && /^\d{4}-\d{2}-\d{2}$/.test(submission_date)) {
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
      schedule = {
        submission_start_at: submissionStart.toISOString(),
        submission_end_at: endOfDay(submissionStart).toISOString(),
        voting_start_at: votingStart.toISOString(),
        voting_end_at: endOfDay(votingStart).toISOString(),
      }
    } else {
      return NextResponse.json({ error: '일정 정보가 필요해요.' }, { status: 400 })
    }

    const scheduleError = validateSchedule(schedule)
    if (scheduleError) {
      return NextResponse.json({ error: scheduleError }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    const { data: challenge, error: insertError } = await serviceSupabase
      .from('challenges')
      .insert({
        title,
        instruction,
        model_name: model_name || 'gemini-2.5-flash',
        temperature: temperature || 0.7,
        wrapper_text: wrapper_text || null,
        ...schedule,
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
