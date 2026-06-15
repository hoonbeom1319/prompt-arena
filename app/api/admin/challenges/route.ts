import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deriveTwoDayISO, validateSchedule } from '@/lib/challenge-schedule'

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

    if (!title || !instruction) {
      return NextResponse.json({ error: '제목과 설명은 필수예요.' }, { status: 400 })
    }

    if (!submission_date || !/^\d{4}-\d{2}-\d{2}$/.test(submission_date)) {
      return NextResponse.json({ error: '제출일 형식이 올바르지 않아요.' }, { status: 400 })
    }

    // 제출일 하나로 2일 주기 전체를 자동 파생한다.
    const schedule = deriveTwoDayISO(submission_date)
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
