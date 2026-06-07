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
      submission_start_at,
      submission_end_at,
      voting_start_at,
      voting_end_at,
    } = body

    if (!title || !instruction || !submission_start_at || !submission_end_at || !voting_start_at || !voting_end_at) {
      return NextResponse.json({ error: '필수 필드가 누락됐어요.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    const { data: challenge, error: insertError } = await serviceSupabase
      .from('challenges')
      .insert({
        title,
        instruction,
        model_name: model_name || 'gemini-1.5-flash',
        temperature: temperature || 0.7,
        wrapper_text: wrapper_text || null,
        submission_start_at: new Date(submission_start_at).toISOString(),
        submission_end_at: new Date(submission_end_at).toISOString(),
        voting_start_at: new Date(voting_start_at).toISOString(),
        voting_end_at: new Date(voting_end_at).toISOString(),
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
