import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import { awardCoins, checkAndAwardBadge, COIN_AMOUNTS } from '@/lib/coins'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { challengeId, generationId } = await request.json()

    if (!challengeId || !generationId) {
      return NextResponse.json({ error: '챌린지 ID와 생성 ID가 필요해요.' }, { status: 400 })
    }

    // Get challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    // Period check
    const state = getChallengeState(challenge)
    if (state !== 'submission') {
      return NextResponse.json({ error: '현재 제출 기간이 아니에요.' }, { status: 403 })
    }

    // Check generation belongs to user and challenge
    const { data: generation } = await supabase
      .from('generations')
      .select('id')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single()

    if (!generation) {
      return NextResponse.json({ error: '유효하지 않은 생성 결과예요.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    // Check no existing submission
    const { data: existing } = await serviceSupabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single()

    if (existing) {
      return NextResponse.json({ error: '이미 이 챌린지에 제출했어요.' }, { status: 409 })
    }

    // Insert submission
    const { data: submission, error: insertError } = await serviceSupabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        generation_id: generationId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: '제출에 실패했어요.' }, { status: 500 })
    }

    // Award coins
    await awardCoins(serviceSupabase, user.id, COIN_AMOUNTS.SUBMIT_PROMPT, '프롬프트 제출', challengeId)

    // Check first submission badge
    const { count: submissionCount } = await serviceSupabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (submissionCount === 1) {
      await checkAndAwardBadge(serviceSupabase, user.id, 'first_submission')
    }

    // Check participation_10 badge
    if ((submissionCount ?? 0) >= 10) {
      await checkAndAwardBadge(serviceSupabase, user.id, 'participation_10')
    }

    return NextResponse.json({ submission, coinsAwarded: COIN_AMOUNTS.SUBMIT_PROMPT })
  } catch (err) {
    console.error('Submit route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
