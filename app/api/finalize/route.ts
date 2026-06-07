import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import { awardCoins, checkAndAwardBadge, COIN_AMOUNTS } from '@/lib/coins'

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

    // Support both JSON body and form data
    let challengeId: string
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      challengeId = body.challengeId
    } else {
      const formData = await request.formData()
      challengeId = formData.get('challengeId') as string
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

    // Get all submissions
    const { data: submissions } = await serviceSupabase
      .from('submissions')
      .select('id, user_id')
      .eq('challenge_id', challengeId)
      .eq('is_seed', false)

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: '제출물이 없어요.' }, { status: 400 })
    }

    // Count votes per submission
    const voteCounts: Record<string, number> = {}
    for (const sub of submissions) {
      const { count } = await serviceSupabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', sub.id)
      voteCounts[sub.id] = count ?? 0
    }

    // Sort by vote count descending
    const sorted = [...submissions].sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))

    // Update each submission with rank and vote count
    for (let i = 0; i < sorted.length; i++) {
      const sub = sorted[i]
      const rank = i + 1

      await serviceSupabase
        .from('submissions')
        .update({
          final_rank: rank,
          final_vote_count: voteCounts[sub.id] ?? 0,
        })
        .eq('id', sub.id)

      // Award coins for top 3
      const coinAmounts: Record<number, number> = {
        1: COIN_AMOUNTS.RANK_1,
        2: COIN_AMOUNTS.RANK_2,
        3: COIN_AMOUNTS.RANK_3,
      }

      if (rank <= 3 && coinAmounts[rank]) {
        await awardCoins(
          serviceSupabase,
          sub.user_id,
          coinAmounts[rank],
          `${rank}등 보상`,
          challengeId
        )

        // Award badges
        if (rank === 1) {
          await checkAndAwardBadge(serviceSupabase, sub.user_id, 'first_win')

          // Check 3 wins
          const { count: winCount } = await serviceSupabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', sub.user_id)
            .eq('final_rank', 1)

          if ((winCount ?? 0) >= 3) {
            await checkAndAwardBadge(serviceSupabase, sub.user_id, 'wins_3')
          }
        }
      }
    }

    // Check votes_30 badge for active voters
    const { data: topVoters } = await serviceSupabase
      .from('votes')
      .select('user_id')
      .eq('challenge_id', challengeId)

    const voterIds = [...new Set(topVoters?.map(v => v.user_id) ?? [])]
    for (const voterId of voterIds) {
      const { count: totalVotes } = await serviceSupabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', voterId)

      if ((totalVotes ?? 0) >= 30) {
        await checkAndAwardBadge(serviceSupabase, voterId, 'votes_30')
      }
    }

    return NextResponse.json({
      success: true,
      finalizedCount: sorted.length,
    })
  } catch (err) {
    console.error('Finalize route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
