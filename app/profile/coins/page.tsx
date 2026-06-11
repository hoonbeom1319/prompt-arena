import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import { Card } from '@/ds/card'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '코인 내역 — 프롬프트 아레나',
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

export default async function CoinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('users').select('coin_balance').eq('id', user.id).single(),
    supabase
      .from('coin_transactions')
      .select('id, amount, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // 날짜별 그룹핑
  const grouped: Record<string, NonNullable<typeof transactions>> = {}
  for (const tx of transactions ?? []) {
    const date = formatDate(tx.created_at)
    ;(grouped[date] ??= []).push(tx)
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="코인 내역" showBack backHref="/profile" />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10 flex flex-col gap-4">
        <Card className="p-4 flex items-center justify-between">
          <span className="text-sm text-text-muted">보유 코인</span>
          <span className="text-xl font-extrabold text-accent tabular-nums">
            {(profile?.coin_balance ?? 0).toLocaleString()}
          </span>
        </Card>

        {Object.keys(grouped).length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-text-muted">코인 내역이 없어요</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                {date}
              </div>
              <Card className="divide-y divide-border">
                {txs.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-3.5 py-3">
                    <div>
                      <p className="text-sm text-text-primary">{tx.reason}</p>
                      <p className="text-xs text-text-faint mt-0.5">{formatTime(tx.created_at)}</p>
                    </div>
                    <span className={['text-sm font-bold tabular-nums', tx.amount > 0 ? 'text-success' : 'text-error'].join(' ')}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
