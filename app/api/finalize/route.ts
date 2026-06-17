import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { finalizeChallenge } from '@/lib/challenge/finalize'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    let challengeId: string
    const contentType = request.headers.get('content-type') ?? ''
    const isFormPost = !contentType.includes('application/json')

    if (isFormPost) {
      const formData = await request.formData()
      challengeId = formData.get('challengeId') as string
    } else {
      const body = await request.json()
      challengeId = body.challengeId
    }

    if (!challengeId) {
      return NextResponse.json({ error: '챌린지 ID가 필요해요.' }, { status: 400 })
    }

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    const state = getChallengeState(challenge)
    if (state !== 'results') {
      return NextResponse.json({ error: '투표가 아직 끝나지 않았어요.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()
    const result = await finalizeChallenge(serviceSupabase, challengeId)

    if (isFormPost) {
      return NextResponse.redirect(new URL('/admin/challenges', request.url))
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Finalize route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
