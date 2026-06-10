import type { SupabaseClient } from '@supabase/supabase-js'
import { rankSubmissions } from '@/lib/ranking'
import { awardCoins, checkAndAwardBadge, COIN_AMOUNTS } from '@/lib/coins'

export interface FinalizeResult {
  skipped: boolean
  finalizedCount: number
}

export async function finalizeChallenge(
  serviceSupabase: SupabaseClient,
  challengeId: string
): Promise<FinalizeResult> {
  // Idempotency guard — already finalized if any non-seed submission has final_rank
  const { data: existing } = await serviceSupabase
    .from('submissions')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('is_seed', false)
    .not('final_rank', 'is', null)
    .limit(1)

  if (existing && existing.length > 0) {
    return { skipped: true, finalizedCount: 0 }
  }

  const { data: submissions } = await serviceSupabase
    .from('submissions')
    .select('id, user_id, submitted_at, generations!inner(attempt_number)')
    .eq('challenge_id', challengeId)
    .eq('is_seed', false)

  if (!submissions || submissions.length === 0) {
    return { skipped: false, finalizedCount: 0 }
  }

  const voteCounts: Record<string, number> = {}
  for (const sub of submissions) {
    const { count } = await serviceSupabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', sub.id)
    voteCounts[sub.id] = count ?? 0
  }

  type SubmissionRow = {
    id: string
    user_id: string
    submitted_at: string
    generations: { attempt_number: number } | Array<{ attempt_number: number }>
  }
  const rankable = (submissions as SubmissionRow[]).map((sub) => {
    const gen = Array.isArray(sub.generations) ? sub.generations[0] : sub.generations
    return {
      id: sub.id,
      user_id: sub.user_id,
      voteCount: voteCounts[sub.id] ?? 0,
      attemptNumber: gen?.attempt_number ?? 1,
      submittedAt: sub.submitted_at,
    }
  })
  const sorted = rankSubmissions(rankable)

  for (const sub of sorted) {
    await serviceSupabase
      .from('submissions')
      .update({ final_rank: sub.rank, final_vote_count: voteCounts[sub.id] ?? 0 })
      .eq('id', sub.id)

    const coinAmounts: Record<number, number> = {
      1: COIN_AMOUNTS.RANK_1,
      2: COIN_AMOUNTS.RANK_2,
      3: COIN_AMOUNTS.RANK_3,
    }

    if (sub.rank <= 3 && coinAmounts[sub.rank]) {
      await awardCoins(serviceSupabase, sub.user_id, coinAmounts[sub.rank], `${sub.rank}등 보상`, challengeId)

      if (sub.rank === 1) {
        await checkAndAwardBadge(serviceSupabase, sub.user_id, 'first_win')

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

  const { data: topVoters } = await serviceSupabase
    .from('votes')
    .select('user_id')
    .eq('challenge_id', challengeId)

  const voterIds = [...new Set(topVoters?.map((v: { user_id: string }) => v.user_id) ?? [])]
  for (const voterId of voterIds) {
    const { count: totalVotes } = await serviceSupabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', voterId)

    if ((totalVotes ?? 0) >= 30) {
      await checkAndAwardBadge(serviceSupabase, voterId, 'votes_30')
    }
  }

  return { skipped: false, finalizedCount: sorted.length }
}
