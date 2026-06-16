import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState, getNextTransition, type Challenge, type ChallengeState } from '@/lib/challenge-state'
import { rankSubmissions } from '@/lib/ranking'

export interface TopRankEntry {
  id: string
  rank: number
  votes: number
}

export interface NextChallengePreview {
  title: string
  category?: string | null
  startAt: string
}

export const fetchHomeData = async (challenge: Challenge | null, userId?: string | null) => {
  const supabase = await createClient()
  const now = new Date()

  if (!challenge) {
    const nextChallenge = await fetchNextChallenge(supabase, now)
    return {
      state: null as ChallengeState | null,
      nextChallenge,
      participantCount: 0,
      submissionCount: 0,
      totalVotes: 0,
      userGenCount: 0,
      userVoteCount: 0,
      userSubmissionId: null as string | null,
      userRank: null as number | null,
      userVotes: null as number | null,
      top3: [] as TopRankEntry[],
      category: null as string | null,
      countdownTarget: null as string | null,
      countdownLabel: null as string | null,
    }
  }

  const state = getChallengeState(challenge, now)
  const nextTransition = getNextTransition(challenge, now)

  let category: string | null = null
  if (challenge.category_id) {
    const { data } = await supabase.from('categories').select('name').eq('id', challenge.category_id).single()
    category = data?.name ?? null
  }

  const { count: participantCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id)

  const submissionCount = participantCount ?? 0

  let userGenCount = 0
  let userSubmissionId: string | null = null
  let userVoteCount = 0
  let userRank: number | null = null
  let userVotes: number | null = null
  let totalVotes = 0
  let top3: TopRankEntry[] = []

  if (userId) {
    const { count: genCount } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)
      .eq('user_id', userId)
    userGenCount = genCount ?? 0

    const { data: submission } = await supabase
      .from('submissions')
      .select('id, final_rank, final_vote_count')
      .eq('challenge_id', challenge.id)
      .eq('user_id', userId)
      .single()

    if (submission) {
      userSubmissionId = submission.id
      userRank = submission.final_rank
      userVotes = submission.final_vote_count
    }

    if (state === 'voting') {
      const { count: myVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
      userVoteCount = myVotes ?? 0
    }
  }

  if (state === 'voting') {
    const service = await createServiceClient()
    const { count: voteCount } = await service
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)
    totalVotes = voteCount ?? 0
  }

  if (state === 'results') {
    top3 = await fetchTop3(challenge.id)
  }

  const nextChallenge = await fetchNextChallenge(supabase, now, challenge.id)

  return {
    state,
    category,
    participantCount: submissionCount,
    submissionCount,
    totalVotes,
    userGenCount,
    userVoteCount,
    userSubmissionId,
    userRank,
    userVotes,
    top3,
    nextChallenge,
    countdownTarget: nextTransition?.time.toISOString() ?? null,
    countdownLabel: nextTransition ? `${nextTransition.label}까지` : null,
    votingStartAt: challenge.voting_start_at ?? null,
  }
}

const fetchTop3 = async (challengeId: string): Promise<TopRankEntry[]> => {
  const service = await createServiceClient()

  const { data: submissions } = await service
    .from('submissions')
    .select('id, final_rank, final_vote_count, user_id, submitted_at, generations!inner(attempt_number)')
    .eq('challenge_id', challengeId)

  if (!submissions || submissions.length === 0) return []

  const hasFinalRank = submissions.some(s => s.final_rank != null)

  if (hasFinalRank) {
    return submissions
      .filter(s => s.final_rank != null && s.final_rank <= 3)
      .sort((a, b) => (a.final_rank ?? 99) - (b.final_rank ?? 99))
      .map(s => ({
        id: s.id,
        rank: s.final_rank!,
        votes: s.final_vote_count ?? 0,
      }))
  }

  const subIds = submissions.map(s => s.id)
  const voteCounts: Record<string, number> = {}
  for (const subId of subIds) {
    const { count } = await service
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', subId)
    voteCounts[subId] = count ?? 0
  }

  const rankable = submissions.map(s => {
    const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
    return {
      id: s.id,
      user_id: s.user_id,
      voteCount: voteCounts[s.id] ?? 0,
      attemptNumber: gen?.attempt_number ?? 1,
      submittedAt: s.submitted_at,
      result_text: '',
      prompt_text: '',
    }
  })

  return rankSubmissions(rankable)
    .filter(s => s.rank <= 3)
    .map(s => ({ id: s.id, rank: s.rank, votes: s.voteCount }))
}

const fetchNextChallenge = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  now: Date,
  excludeId?: string,
): Promise<NextChallengePreview | null> => {
  let query = supabase
    .from('challenges')
    .select('id, title, submission_start_at, category_id')
    .eq('is_active', true)
    .gt('submission_start_at', now.toISOString())
    .order('submission_start_at', { ascending: true })
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.maybeSingle()
  if (!data) return null

  let category: string | null = null
  if (data.category_id) {
    const { data: cat } = await supabase.from('categories').select('name').eq('id', data.category_id).single()
    category = cat?.name ?? null
  }

  return {
    title: data.title,
    category,
    startAt: data.submission_start_at,
  }
}
