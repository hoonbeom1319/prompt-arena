import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import ChallengeHero from '@/components/ChallengeHero'
import { Card } from '@/ds/card'

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

  const state = currentChallenge ? getChallengeState(currentChallenge, now) : null

  const statusLabel = state === 'submission' ? '제출 기간'
    : state === 'voting' ? '투표 기간'
    : state === 'results' ? '결과 발표'
    : undefined

  let participantCount = 0
  if (currentChallenge) {
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', currentChallenge.id)
    participantCount = count ?? 0
  }

  let userSubmission = null
  if (user && currentChallenge) {
    const { data } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', currentChallenge.id)
      .single()
    userSubmission = data
  }

  const { data: pastChallenges } = await supabase
    .from('challenges')
    .select('id, title, voting_end_at')
    .eq('is_active', true)
    .lt('voting_end_at', now.toISOString())
    .order('voting_end_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="프롬프트 아레나" statusLabel={statusLabel} />

      <main className="max-w-[430px] mx-auto px-4 pt-6 pb-20">
        {/* Hero Section */}
        {currentChallenge && state ? (
          <ChallengeHero
            challenge={currentChallenge}
            state={state}
            participantCount={participantCount}
            userSubmission={userSubmission}
            userId={user?.id ?? null}
          />
        ) : (
          <Card className="p-12 text-center mb-6">
            <div className="text-5xl mb-4" aria-hidden="true">⏳</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              다음 챌린지를 준비 중이에요
            </h1>
            <p className="text-base text-text-secondary">
              곧 새로운 챌린지가 시작됩니다. 알림을 받으려면 로그인하세요.
            </p>
          </Card>
        )}

        {/* How it works */}
        <Card className="p-6 mb-6">
          <h2 className="text-base font-bold text-text-primary mb-5">어떻게 참여하나요?</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            {[
              { step: '1', icon: '✍️', title: '프롬프트 작성', desc: '챌린지 주제에 맞는 AI 프롬프트를 작성해요. 최대 3번 시도할 수 있어요.' },
              { step: '2', icon: '🤖', title: 'AI 응답 확인', desc: 'Gemini AI가 내 프롬프트로 응답을 생성해요.' },
              { step: '3', icon: '🗳️', title: '투표 참여', desc: '다른 참가자들의 AI 응답을 보고 최고의 결과물에 투표해요.' },
              { step: '4', icon: '🏆', title: '순위 공개', desc: '투표 결과로 순위가 매겨지고 코인이 지급돼요.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {item.step}
                  </div>
                  <span className="text-[22px]" aria-hidden="true">{item.icon}</span>
                  <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed pl-8">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Coin rewards */}
        <Card className="p-6 mb-6">
          <h2 className="text-base font-bold text-text-primary mb-4">🪙 코인 보상</h2>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: '프롬프트 제출', coins: '+5' },
              { label: '투표 1회', coins: '+1' },
              { label: '1등', coins: '+100' },
              { label: '2등', coins: '+50' },
              { label: '3등', coins: '+25' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-base border border-border rounded-full text-[13px]"
              >
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-bold text-accent">{item.coins} 🪙</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Past challenges */}
        {pastChallenges && pastChallenges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-text-primary">최근 챌린지</h2>
              <Link href="/archive" className="text-[13px] text-accent no-underline hover:text-accent-hover transition-colors">
                전체 보기 →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {pastChallenges.map(c => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}/results`}
                  className="flex items-center justify-between px-4 py-3.5 bg-bg-card border border-border rounded-lg no-underline shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow"
                >
                  <span className="text-sm font-medium text-text-primary">{c.title}</span>
                  <span className="text-xs text-text-muted">결과 보기 →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <TabBar />
    </div>
  )
}
