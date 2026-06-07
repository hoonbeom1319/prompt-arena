import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import { awardCoins, COIN_AMOUNTS } from '@/lib/coins'

const MAX_VOTES = 3

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { challengeId, submissionId } = await request.json()

    if (!challengeId || !submissionId) {
      return NextResponse.json({ error: '챌린지 ID와 제출 ID가 필요해요.' }, { status: 400 })
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

    // Period check — voting only
    const state = getChallengeState(challenge)
    if (state !== 'voting') {
      return NextResponse.json({ error: '현재 투표 기간이 아니에요.' }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()

    // Check vote count
    const { count: voteCount } = await serviceSupabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)

    if ((voteCount ?? 0) >= MAX_VOTES) {
      return NextResponse.json({ error: '이미 3표를 모두 사용했어요.' }, { status: 429 })
    }

    // Check duplicate vote
    const { data: existingVote } = await serviceSupabase
      .from('votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('submission_id', submissionId)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: '이미 이 제출물에 투표했어요.' }, { status: 409 })
    }

    // Insert vote
    const { data: vote, error: insertError } = await serviceSupabase
      .from('votes')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        submission_id: submissionId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Vote insert error:', insertError)
      return NextResponse.json({ error: '투표에 실패했어요.' }, { status: 500 })
    }

    // Award coin
    await awardCoins(serviceSupabase, user.id, COIN_AMOUNTS.CAST_VOTE, '투표 참여', challengeId)

    const newVoteCount = (voteCount ?? 0) + 1

    return NextResponse.json({
      vote,
      coinsAwarded: COIN_AMOUNTS.CAST_VOTE,
      votesUsed: newVoteCount,
      revealed: newVoteCount >= MAX_VOTES,
    })
  } catch (err) {
    console.error('Vote route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
