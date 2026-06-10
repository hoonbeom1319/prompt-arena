import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import { fetchHomeData } from '@/lib/home-data'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import HomeBody from '@/components/home/HomeBody'

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

      <main className="max-w-[430px] mx-auto px-4 pt-4 pb-20 flex flex-col gap-3.5">
        {currentChallenge && homeData.state ? (
          <HomeBody
            challengeId={currentChallenge.id}
            title={currentChallenge.title}
            instruction={currentChallenge.instruction}
            category={homeData.category}
            state={homeData.state}
            countdownTarget={homeData.countdownTarget}
            countdownLabel={homeData.countdownLabel}
            participantCount={homeData.participantCount}
            submissionCount={homeData.submissionCount}
            totalVotes={homeData.totalVotes}
            userId={user?.id ?? null}
            userGenCount={homeData.userGenCount}
            userVoteCount={homeData.userVoteCount}
            userSubmissionId={homeData.userSubmissionId}
            userRank={homeData.userRank}
            userVotes={homeData.userVotes}
            top3={homeData.top3}
            nextChallenge={homeData.nextChallenge}
          />
        ) : (
          <HomeBody
            challengeId=""
            title=""
            instruction=""
            state="idle"
            participantCount={0}
            submissionCount={0}
            totalVotes={0}
            userGenCount={0}
            userVoteCount={0}
            top3={[]}
            nextChallenge={homeData.nextChallenge}
          />
        )}
      </main>

      <TabBar />
    </div>
  )
}
