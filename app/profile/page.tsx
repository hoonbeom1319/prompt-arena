import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import RankBadge from '@/components/RankBadge'
import { Card } from '@/ds/card'
import LogoutButton from './LogoutButton'
import { NicknameEditor } from './NicknameEditor'

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

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`id, submitted_at, final_rank, final_vote_count, challenge_id, challenges(title)`)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  const joinMonth = new Date(profile.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit',
  }).replace('. ', '.').replace('.', '년 ').replace('.', '월').trim()

  const anonId = user.id.replace(/-/g, '').slice(0, 6)
  const initial = anonId[0]?.toUpperCase() ?? '?'
  const submissionCount = submissions?.length ?? 0
  const bestRank = submissions?.reduce((best: number | null, s) => {
    if (!s.final_rank) return best
    return best === null ? s.final_rank : Math.min(best, s.final_rank)
  }, null)

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="내 프로필" rightContent={<LogoutButton />} />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-20 md:pb-10 flex flex-col gap-3.5">
        {/* 아바타 + 닉네임 */}
        <Card className="p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full bg-accent-light border border-accent-mid flex items-center justify-center text-base font-bold text-accent shrink-0"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <NicknameEditor nickname={profile.nickname} />
            <div className="text-xs text-text-muted mt-0.5">{joinMonth} 가입</div>
          </div>
        </Card>

        {/* 통계 3칸 */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3 text-center">
            <div className="text-[22px] font-extrabold text-accent tabular-nums leading-tight">
              {profile.coin_balance.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-text-muted mt-0.5">코인</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-[22px] font-extrabold text-text-primary tabular-nums leading-tight">
              {bestRank ?? '—'}
            </div>
            <div className="text-[11.5px] text-text-muted mt-0.5">최고 순위</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-[22px] font-extrabold text-text-primary tabular-nums leading-tight">
              #{submissionCount}
            </div>
            <div className="text-[11.5px] text-text-muted mt-0.5">응모</div>
          </Card>
        </div>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:items-start">
        {/* 지난 챌린지 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">지난 챌린지</span>
            <Link href="/archive" className="text-xs text-accent no-underline">전체 보기 &rsaquo;</Link>
          </div>
          {!submissions || submissions.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-text-muted">아직 참여한 챌린지가 없어요</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-1.5">
              {submissions.map(sub => {
                const challenge = Array.isArray(sub.challenges) ? sub.challenges[0] : sub.challenges
                return (
                  <Link
                    key={sub.id}
                    href={`/challenge/${sub.challenge_id}/results`}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-bg-card border border-border rounded-md no-underline hover:border-border-strong transition-colors"
                  >
                    <span className="text-sm text-text-primary truncate">
                      {(challenge as { title: string } | null)?.title ?? '챌린지'}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      {sub.final_rank ? (
                        <>
                          <RankBadge rank={sub.final_rank} />
                          <span className="text-xs text-text-muted tabular-nums">{sub.final_vote_count ?? 0}표</span>
                        </>
                      ) : (
                        <span className="text-xs text-text-faint">집계 전</span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* 코인 획득 내역 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">코인 획득 내역</span>
            <Link href="/profile/coins" className="text-xs text-accent no-underline">전체 내역 &rsaquo;</Link>
          </div>
          {!transactions || transactions.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-text-muted">코인 내역이 없어요</p>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-sm text-text-primary">{tx.reason}</span>
                  <span className={['text-sm font-semibold tabular-nums', tx.amount > 0 ? 'text-success' : 'text-error'].join(' ')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
        </div>
      </main>

      <TabBar />
    </div>
  )
}
