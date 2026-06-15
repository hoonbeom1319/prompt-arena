import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deriveTwoDayISO, validateSchedule } from '@/lib/challenge-schedule'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // 제출일 하나로 2일 주기 전체를 자동 파생한다 (생성과 동일 기조).
    const schedule = deriveTwoDayISO(submission_date)
    const scheduleError = validateSchedule(schedule)
    if (scheduleError) {
      return NextResponse.json({ error: scheduleError }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    const { data: challenge, error: updateError } = await serviceSupabase
      .from('challenges')
      .update({
        title,
        instruction,
        model_name: model_name || 'gemini-2.5-flash',
        temperature: temperature ?? 0.7,
        wrapper_text: wrapper_text || null,
        ...schedule,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Challenge update error:', updateError)
      return NextResponse.json({ error: '챌린지 수정에 실패했어요.' }, { status: 500 })
    }

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    return NextResponse.json({ challenge })
  } catch (err) {
    console.error('Admin challenge PATCH error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
