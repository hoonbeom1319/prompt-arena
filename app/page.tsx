import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge-state'
import Header from '@/components/Header'
import ChallengeHero from '@/components/ChallengeHero'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get active challenges sorted by most recent
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const now = new Date()

  // Find the most relevant challenge (submission or voting first, then most recent)
  let currentChallenge = null
  if (challenges && challenges.length > 0) {
    // Prefer submission > voting > results > idle
    const priority: Record<string, number> = { submission: 0, voting: 1, results: 2, idle: 3 }
    const sorted = [...challenges].sort((a, b) => {
      const sa = getChallengeState(a, now)
      const sb = getChallengeState(b, now)
      return priority[sa] - priority[sb]
    })
    currentChallenge = sorted[0]
  }

  const state = currentChallenge ? getChallengeState(currentChallenge, now) : null

  // Get participant count
  let participantCount = 0
  if (currentChallenge) {
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', currentChallenge.id)
    participantCount = count ?? 0
  }

  // Get user's submission if logged in
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

  // Get recent past challenges
  const { data: pastChallenges } = await supabase
    .from('challenges')
    .select('id, title, voting_end_at')
    .eq('is_active', true)
    .lt('voting_end_at', now.toISOString())
    .order('voting_end_at', { ascending: false })
    .limit(3)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
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
          <div className="card" style={{ padding: '48px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              다음 챌린지를 준비 중이에요
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              곧 새로운 챌린지가 시작됩니다. 알림을 받으려면 로그인하세요.
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            어떻게 참여하나요?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {[
              { step: '1', icon: '✍️', title: '프롬프트 작성', desc: '챌린지 주제에 맞는 AI 프롬프트를 작성해요. 최대 5번 시도할 수 있어요.' },
              { step: '2', icon: '🤖', title: 'AI 응답 확인', desc: 'Gemini AI가 내 프롬프트로 응답을 생성해요.' },
              { step: '3', icon: '🗳️', title: '투표 참여', desc: '다른 참가자들의 AI 응답을 보고 최고의 결과물에 투표해요.' },
              { step: '4', icon: '🏆', title: '순위 공개', desc: '투표 결과로 순위가 매겨지고 코인이 지급돼요.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.step}
                  </div>
                  <span style={{ fontSize: '22px' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', paddingLeft: '32px' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coin rewards */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            🪙 코인 보상
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { label: '프롬프트 제출', coins: '+5' },
              { label: '투표 1회', coins: '+1' },
              { label: '1등', coins: '+100' },
              { label: '2등', coins: '+50' },
              { label: '3등', coins: '+25' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{item.coins} 🪙</span>
              </div>
            ))}
          </div>
        </div>

        {/* Past challenges */}
        {pastChallenges && pastChallenges.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                최근 챌린지
              </h2>
              <Link href="/archive" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                전체 보기 →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastChallenges.map(c => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}/results`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {c.title}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    결과 보기 →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
