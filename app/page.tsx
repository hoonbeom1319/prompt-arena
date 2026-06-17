import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { fetchHomeData } from '@/lib/challenge/home-data'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import HomeBody from '@/widgets/home/HomeBody'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const now = new Date()

  let currentChallenge = null
  if (challenges && challenges.length > 0) {
    const priority: Record<string, number> = { submission: 0, voting: 1, results: 2, idle: 3 }
    const sorted = [...challenges].sort((a, b) => {
      const sa = getChallengeState(a, now)
      const sb = getChallengeState(b, now)
      return priority[sa] - priority[sb]
    })
    currentChallenge = sorted[0]
  }

  const homeData = await fetchHomeData(currentChallenge, user?.id ?? null)

  const statusLabel = homeData.state === 'submission' ? '제출 기간'
    : homeData.state === 'voting' ? '투표 기간'
    : homeData.state === 'results' ? '결과 발표'
    : currentChallenge ? '대기 중'
    : undefined

  const statusVariant = homeData.state && homeData.state !== 'idle' ? 'accent' as const : 'outline' as const

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="프롬프트 아레나" statusLabel={statusLabel} statusVariant={statusVariant} />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-20 md:pb-10 flex flex-col gap-3.5">
        {currentChallenge && homeData.state ? (
          <HomeBody
            state={homeData.state}
            challenge={{
              id: currentChallenge.id,
              title: currentChallenge.title,
              instruction: currentChallenge.instruction,
              category: homeData.category,
              votingStartAt: homeData.votingStartAt,
            }}
            countdown={homeData.countdownTarget
              ? { target: homeData.countdownTarget, label: homeData.countdownLabel! }
              : null}
            stats={{
              participants: homeData.participantCount,
              submissions: homeData.submissionCount,
              totalVotes: homeData.totalVotes,
            }}
            user={user ? {
              id: user.id,
              genCount: homeData.userGenCount,
              voteCount: homeData.userVoteCount,
              submissionId: homeData.userSubmissionId,
              rank: homeData.userRank,
              votes: homeData.userVotes,
            } : null}
            top3={homeData.top3}
            nextChallenge={homeData.nextChallenge}
          />
        ) : (
          <HomeBody state="idle" nextChallenge={homeData.nextChallenge} />
        )}
      </main>

      <TabBar />
    </div>
  )
}
