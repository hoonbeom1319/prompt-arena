import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import CoinDisplay from '@/components/CoinDisplay'
import BadgeList from '@/components/BadgeList'
import Link from 'next/link'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

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

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`badge_id, earned_at, badges(id, name, description, icon)`)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  const badges = userBadges?.map(ub => {
    const badge = Array.isArray(ub.badges) ? ub.badges[0] : ub.badges
    return badge
  }).filter(Boolean) ?? []

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, created_at, challenge_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`id, submitted_at, final_rank, final_vote_count, challenge_id, challenges(title)`)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(10)

  const joinDate = new Date(profile.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="내 프로필" />

      <main className="max-w-[430px] mx-auto px-4 pt-6 pb-20">
        {/* Profile header */}
        <Card className="p-7 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-[60px] h-[60px] rounded-full bg-accent-light flex items-center justify-center text-2xl font-bold text-accent border-2 border-accent"
                aria-hidden="true"
              >
                {profile.nickname[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-text-primary mb-1">{profile.nickname}</h1>
                <p className="text-[13px] text-text-muted">{joinDate}에 가입</p>
                {profile.is_admin && (
                  <Badge variant="accent" className="mt-1.5 text-[11px]">관리자</Badge>
                )}
              </div>
            </div>
            <CoinDisplay balance={profile.coin_balance} size="lg" />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '제출', value: submissions?.length ?? 0, icon: '✍️' },
            { label: '뱃지', value: badges.length, icon: '🏅' },
            { label: '획득 코인', value: transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) ?? 0, icon: '🪙' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 text-center">
              <div className="text-2xl mb-1" aria-hidden="true">{stat.icon}</div>
              <div className="text-[22px] font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Badges */}
        <Card className="p-6 mb-6">
          <h2 className="text-base font-bold text-text-primary mb-4">뱃지</h2>
          <BadgeList badges={badges as Array<{ id: string; name: string; description: string; icon: string }>} />
        </Card>

        {/* Submission history */}
        <Card className="p-6 mb-6">
          <h2 className="text-base font-bold text-text-primary mb-4">참여 기록</h2>
          {!submissions || submissions.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">아직 참여한 챌린지가 없어요</p>
          ) : (
            <div className="flex flex-col gap-2">
              {submissions.map(sub => {
                const challenge = Array.isArray(sub.challenges) ? sub.challenges[0] : sub.challenges
                return (
                  <Link
                    key={sub.id}
                    href={`/challenge/${sub.challenge_id}/results`}
                    className="flex items-center justify-between px-3.5 py-3 bg-bg-base rounded-lg border border-border no-underline hover:border-border-strong transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-text-primary mb-0.5">
                        {(challenge as { title: string } | null)?.title ?? '챌린지'}
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(sub.submitted_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    {sub.final_rank && (
                      <div className={['text-sm font-bold', sub.final_rank <= 3 ? 'text-accent' : 'text-text-secondary'].join(' ')}>
                        {sub.final_rank === 1 ? '🥇' : sub.final_rank === 2 ? '🥈' : sub.final_rank === 3 ? '🥉' : `${sub.final_rank}위`}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Coin history */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-text-primary mb-4">코인 내역</h2>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">코인 내역이 없어요</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-bg-base rounded-lg border border-border"
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">{tx.reason}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <span className={['text-[15px] font-bold', tx.amount > 0 ? 'text-success' : 'text-error'].join(' ')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <TabBar />
    </div>
  )
}
