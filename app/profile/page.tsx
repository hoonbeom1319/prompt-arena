import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import CoinDisplay from '@/components/CoinDisplay'
import BadgeList from '@/components/BadgeList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, coin_balance, is_admin, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Get earned badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      badge_id,
      earned_at,
      badges(id, name, description, icon)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  const badges = userBadges?.map(ub => {
    const badge = Array.isArray(ub.badges) ? ub.badges[0] : ub.badges
    return badge
  }).filter(Boolean) ?? []

  // Get coin transaction history
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, created_at, challenge_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get submission history
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submitted_at,
      final_rank,
      final_vote_count,
      challenge_id,
      challenges(title)
    `)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(10)

  const joinDate = new Date(profile.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        {/* Profile header */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--accent)',
                border: '2px solid var(--accent)',
              }}>
                {profile.nickname[0]?.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {profile.nickname}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {joinDate}에 가입
                </p>
                {profile.is_admin && (
                  <span className="badge badge-accent" style={{ marginTop: '6px', fontSize: '11px' }}>관리자</span>
                )}
              </div>
            </div>

            <CoinDisplay balance={profile.coin_balance} size="lg" />
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {[
            { label: '제출', value: submissions?.length ?? 0, icon: '✍️' },
            { label: '뱃지', value: badges.length, icon: '🏅' },
            { label: '획득 코인', value: transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) ?? 0, icon: '🪙' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            뱃지
          </h2>
          <BadgeList badges={badges as Array<{ id: string; name: string; description: string; icon: string }>} />
        </div>

        {/* Submission history */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            참여 기록
          </h2>
          {!submissions || submissions.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              아직 참여한 챌린지가 없어요
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {submissions.map(sub => {
                const challenge = Array.isArray(sub.challenges) ? sub.challenges[0] : sub.challenges
                return (
                  <Link
                    key={sub.id}
                    href={`/challenge/${sub.challenge_id}/results`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {(challenge as { title: string } | null)?.title ?? '챌린지'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(sub.submitted_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    {sub.final_rank && (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: sub.final_rank <= 3 ? 'var(--warning)' : 'var(--text-secondary)',
                      }}>
                        {sub.final_rank === 1 ? '🥇' : sub.final_rank === 2 ? '🥈' : sub.final_rank === 3 ? '🥉' : `${sub.final_rank}위`}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Coin history */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            코인 내역
          </h2>
          {!transactions || transactions.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              코인 내역이 없어요
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {tx.reason}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(tx.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: tx.amount > 0 ? 'var(--success)' : 'var(--error)',
                  }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
