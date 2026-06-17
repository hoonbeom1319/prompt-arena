import { createServiceClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge/challenge-state'
import Link from 'next/link'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import { Button } from '@/ds/button'
import ResetButton from './ResetButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createServiceClient()
  const now = new Date()

  const [
    { count: totalUsers },
    { count: totalChallenges },
    { count: totalSubmissions },
    { count: totalVotes },
    { data: transactions },
    { data: challenges },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('challenges').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('coin_transactions').select('amount'),
    supabase
      .from('challenges')
      .select('id, title, category_id, is_active, submission_start_at, submission_end_at, voting_start_at, voting_end_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalCoinsDistributed = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0

  const categoryMap: Record<string, string> = {}
  const categoryIds = challenges?.map(c => c.category_id).filter(Boolean) ?? []
  if (categoryIds.length > 0) {
    const { data: cats } = await supabase.from('categories').select('id, name').in('id', categoryIds)
    cats?.forEach(c => { categoryMap[c.id] = c.name })
  }

  const challengeStats: Record<string, { submissions: number; seeds: number }> = {}
  if (challenges && challenges.length > 0) {
    const ids = challenges.map(c => c.id)
    const { data: subs } = await supabase
      .from('submissions')
      .select('challenge_id, is_seed')
      .in('challenge_id', ids)

    subs?.forEach(s => {
      if (!challengeStats[s.challenge_id]) {
        challengeStats[s.challenge_id] = { submissions: 0, seeds: 0 }
      }
      challengeStats[s.challenge_id].submissions += 1
      if (s.is_seed) challengeStats[s.challenge_id].seeds += 1
    })
  }

  const currentChallenge = challenges?.find(c => {
    const s = getChallengeState(c as Parameters<typeof getChallengeState>[0], now)
    return s === 'submission' || s === 'voting'
  })

  const currentState = currentChallenge
    ? getChallengeState(currentChallenge as Parameters<typeof getChallengeState>[0], now)
    : null

  const stats = [
    { label: '전체 유저', value: totalUsers ?? 0 },
    { label: '전체 챌린지', value: totalChallenges ?? 0 },
    { label: '전체 제출', value: totalSubmissions ?? 0 },
    { label: '전체 투표', value: totalVotes ?? 0 },
    { label: '배포된 코인', value: totalCoinsDistributed },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-primary">대시보드</h1>
        <ResetButton />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-6">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="text-2xl font-bold text-text-primary mb-1 tabular-nums">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            현재 챌린지
          </div>
          {currentChallenge ? (
            <>
              <div className="text-[15px] font-semibold text-text-primary mb-1 truncate">
                {currentChallenge.title}
              </div>
              <Badge variant="accent" className="text-[11px]">
                {currentState ? getStateLabel(currentState) : '—'}
              </Badge>
            </>
          ) : (
            <p className="text-sm text-text-muted">진행 중인 챌린지 없음</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
            빠른 진입
          </div>
          <div className="flex flex-col gap-2.5">
            <Button asChild variant="primary">
              <Link href="/admin/challenges/new">챌린지 출제</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/seed">시드 제출</Link>
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          챌린지 상태 (시각 계산 · DB에 상태 필드 없음)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="pb-2 font-semibold">주제</th>
                <th className="pb-2 font-semibold">카테고리</th>
                <th className="pb-2 font-semibold">상태</th>
                <th className="pb-2 font-semibold text-right">제출</th>
                <th className="pb-2 font-semibold text-right">시드</th>
              </tr>
            </thead>
            <tbody>
              {challenges?.map(c => {
                const state = getChallengeState(c as Parameters<typeof getChallengeState>[0], now)
                const counts = challengeStats[c.id] ?? { submissions: 0, seeds: 0 }
                const STATE_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'muted' | 'outline'> = {
                  submission: 'success', voting: 'accent', results: 'outline', idle: 'muted',
                }
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 text-text-primary max-w-[200px] truncate">{c.title}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{categoryMap[c.category_id ?? ''] ?? '—'}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={STATE_VARIANT[state]} className="text-[11px]">{getStateLabel(state)}</Badge>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-text-primary">{counts.submissions}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-muted">{counts.seeds}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
