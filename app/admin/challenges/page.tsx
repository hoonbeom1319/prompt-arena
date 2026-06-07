import { createClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminChallengesPage() {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })

  const now = new Date()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
          챌린지 관리
        </h1>
        <Link href="/admin/challenges/new" className="btn-accent" style={{ fontSize: '14px' }}>
          새 챌린지 만들기
        </Link>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!challenges || challenges.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            아직 챌린지가 없어요
          </div>
        ) : (
          <div>
            {challenges.map((c, idx) => {
              const state = getChallengeState(c, now)
              const stateColors: Record<string, string> = {
                submission: '#10B981', voting: '#F59E0B', results: '#D97757', idle: '#6B7280'
              }
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    borderBottom: idx < challenges.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${stateColors[state]}20`,
                        color: stateColors[state],
                      }}>
                        {getStateLabel(state)}
                      </span>
                      {!c.is_active && (
                        <span className="badge badge-muted" style={{ fontSize: '11px' }}>비활성</span>
                      )}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      제출: {new Date(c.submission_start_at).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(c.submission_end_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Link
                      href={`/challenge/${c.id}/results`}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      결과 보기
                    </Link>
                    <FinalizeButton challengeId={c.id} state={state} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FinalizeButton({ challengeId, state }: { challengeId: string; state: string }) {
  if (state !== 'results') return null
  return (
    <form action={`/api/finalize`} method="POST">
      <input type="hidden" name="challengeId" value={challengeId} />
      <button
        type="submit"
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        결과 확정
      </button>
    </form>
  )
}
