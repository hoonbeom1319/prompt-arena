import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Stats
  const [
    { count: totalUsers },
    { count: totalChallenges },
    { count: totalSubmissions },
    { count: totalVotes },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('challenges').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
  ])

  // Total coins spent (Gemini API budget proxy)
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('amount')

  const totalCoinsDistributed = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0

  // Recent activity
  const { data: recentChallenges } = await supabase
    .from('challenges')
    .select('id, title, created_at, is_active')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: '전체 유저', value: totalUsers ?? 0, icon: '👥' },
    { label: '전체 챌린지', value: totalChallenges ?? 0, icon: '🎯' },
    { label: '전체 제출', value: totalSubmissions ?? 0, icon: '✍️' },
    { label: '전체 투표', value: totalVotes ?? 0, icon: '🗳️' },
    { label: '배포된 코인', value: totalCoinsDistributed, icon: '🪙' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
        관리자 대시보드
      </h1>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {stat.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent challenges */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
          최근 챌린지
        </h2>
        {recentChallenges?.map(c => (
          <div key={c.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{c.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(c.created_at).toLocaleDateString('ko-KR')}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: c.is_active ? '#ECFDF5' : '#F3F4F6',
                color: c.is_active ? 'var(--success)' : 'var(--text-muted)',
                fontWeight: '600',
              }}>
                {c.is_active ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
