import { createClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const now = new Date()

  interface ChallengeWithCount {
    id: string
    title: string
    instruction: string
    submission_start_at: string
    submission_end_at: string
    voting_start_at: string
    voting_end_at: string
    model_name: string
    temperature: number
    wrapper_text: string | null
    created_by: string
    is_active: boolean
    created_at: string
    category_id: string | null
    challenge_type: string
    participantCount: number
    state: string
  }

  const challengesWithCounts: ChallengeWithCount[] = []

  if (challenges) {
    for (const c of challenges) {
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', c.id)
      challengesWithCounts.push({
        ...c,
        participantCount: count ?? 0,
        state: getChallengeState(c, now),
      })
    }
  }

  const STATE_COLORS: Record<string, string> = {
    submission: '#10B981',
    voting: '#F59E0B',
    results: '#D97757',
    idle: '#6B7280',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            아카이브
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            지금까지의 모든 챌린지를 확인해보세요
          </p>
        </div>

        {challengesWithCounts.length === 0 ? (
          <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>아직 챌린지가 없어요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {challengesWithCounts.map(challenge => {
              const color = STATE_COLORS[challenge.state] ?? '#6B7280'
              const href = challenge.state === 'results'
                ? `/challenge/${challenge.id}/results`
                : challenge.state === 'voting'
                ? `/challenge/${challenge.id}/vote`
                : challenge.state === 'submission'
                ? `/challenge/${challenge.id}/generate`
                : `/challenge/${challenge.id}/results`

              return (
                <Link
                  key={challenge.id}
                  href={href}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                  }}
                >
                  <div className="card" style={{ padding: '20px', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        {/* State */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `${color}20`,
                          color: color,
                          fontSize: '11px',
                          fontWeight: '600',
                          marginBottom: '8px',
                        }}>
                          <span style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            display: 'inline-block',
                          }} />
                          {getStateLabel(challenge.state as 'submission' | 'voting' | 'results' | 'idle')}
                        </div>

                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.4' }}>
                          {challenge.title}
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                          {challenge.instruction.length > 100
                            ? challenge.instruction.substring(0, 100) + '...'
                            : challenge.instruction}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {challenge.participantCount}명 참여
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(challenge.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}>→</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
