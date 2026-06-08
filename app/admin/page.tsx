import { createClient } from '@/lib/supabase/server'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

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

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('amount')

  const totalCoinsDistributed = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0

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
      <h1 className="text-[22px] font-bold text-text-primary mb-6">관리자 대시보드</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-8">
        {stats.map(stat => (
          <Card key={stat.label} className="p-5 text-center">
            <div className="text-[28px] mb-1.5" aria-hidden="true">{stat.icon}</div>
            <div className="text-2xl font-bold text-text-primary mb-1">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent challenges */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-text-primary mb-4">최근 챌린지</h2>
        {recentChallenges?.map((c, idx) => (
          <div
            key={c.id}
            className={['flex items-center justify-between py-2.5', idx < (recentChallenges.length - 1) ? 'border-b border-border' : ''].join(' ')}
          >
            <span className="text-sm text-text-primary">{c.title}</span>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-text-muted">
                {new Date(c.created_at).toLocaleDateString('ko-KR')}
              </span>
              <Badge variant={c.is_active ? 'success' : 'muted'} className="text-[11px]">
                {c.is_active ? '활성' : '비활성'}
              </Badge>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
