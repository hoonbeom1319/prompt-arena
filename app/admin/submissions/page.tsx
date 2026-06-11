import { createServiceClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

export const dynamic = 'force-dynamic'

const STATE_VARIANT = {
  submission: 'success',
  voting: 'accent',
  results: 'outline',
  idle: 'muted',
} as const

export default async function AdminSubmissionsPage() {
  const supabase = await createServiceClient()
  const now = new Date()

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id, submitted_at, is_seed, final_rank, final_vote_count, challenge_id,
      challenges(id, title, submission_start_at, submission_end_at, voting_start_at, voting_end_at),
      users(nickname),
      generations!inner(prompt_text, result_text)
    `)
    .order('submitted_at', { ascending: false })
    .limit(200)

  // 챌린지별 그룹핑
  type Sub = NonNullable<typeof submissions>[number]
  const grouped = new Map<string, { challenge: Sub['challenges']; subs: Sub[] }>()

  // 실시간 투표수 집계
  const challengeIds = [...new Set((submissions ?? []).map(s => s.challenge_id))]
  const liveVoteCounts = new Map<string, number>()
  if (challengeIds.length > 0) {
    const { data: votes } = await supabase
      .from('votes')
      .select('submission_id')
      .in('challenge_id', challengeIds)
    for (const v of votes ?? []) {
      liveVoteCounts.set(v.submission_id, (liveVoteCounts.get(v.submission_id) ?? 0) + 1)
    }
  }

  for (const sub of submissions ?? []) {
    const cid = sub.challenge_id
    if (!grouped.has(cid)) grouped.set(cid, { challenge: sub.challenges, subs: [] })
    grouped.get(cid)!.subs.push(sub)
  }

  for (const { subs } of grouped.values()) {
    subs.sort((a, b) => {
      const va = a.final_vote_count ?? liveVoteCounts.get(a.id) ?? 0
      const vb = b.final_vote_count ?? liveVoteCounts.get(b.id) ?? 0
      return vb - va
    })
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-1">출품·결과 모니터링</h1>
      <p className="text-sm text-text-secondary mb-5">
        챌린지별 출품작 전체 조회 — 프롬프트·결과물 포함. 부정 출품 삭제는 추후 연결 예정.
      </p>

      {grouped.size === 0 && (
        <Card className="p-12 text-center text-text-muted">아직 출품작이 없어요</Card>
      )}

      <div className="flex flex-col gap-8">
        {[...grouped.entries()].map(([cid, { challenge, subs }]) => {
          const ch = Array.isArray(challenge) ? challenge[0] : challenge
          const state = ch
            ? getChallengeState(ch as Parameters<typeof getChallengeState>[0], now)
            : 'idle'

          return (
            <section key={cid}>
              {/* 챌린지 헤더 */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-[15px] font-bold text-text-primary">
                  {(ch as { title: string } | null)?.title ?? '알 수 없는 챌린지'}
                </h2>
                <Badge variant={STATE_VARIANT[state]} className="text-[11px]">
                  {getStateLabel(state)}
                </Badge>
                <span className="text-xs text-text-muted ml-auto">
                  {subs.length}건 · 시드 {subs.filter(s => s.is_seed).length}
                </span>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted border-b border-border bg-bg-subtle">
                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">작성자</th>
                        <th className="px-4 py-2.5 font-semibold">프롬프트</th>
                        <th className="px-4 py-2.5 font-semibold">결과물</th>
                        <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">득표</th>
                        <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map(sub => {
                        const user = Array.isArray(sub.users) ? sub.users[0] : sub.users
                        const gen = Array.isArray(sub.generations) ? sub.generations[0] : sub.generations
                        const promptText = (gen as { prompt_text: string; result_text: string } | null)?.prompt_text ?? '-'
                        const resultText = (gen as { prompt_text: string; result_text: string } | null)?.result_text ?? '-'
                        const displayVotes = sub.final_vote_count ?? liveVoteCounts.get(sub.id) ?? 0
                        const isLive = sub.final_vote_count == null

                        return (
                          <tr key={sub.id} className="border-b border-border last:border-0 align-top">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-text-primary font-medium">
                                {(user as { nickname: string } | null)?.nickname ?? '알 수 없음'}
                              </span>
                              {sub.is_seed && (
                                <Badge variant="muted" className="ml-1.5 text-[10px]">시드</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-[260px]">
                              <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                {promptText}
                              </p>
                            </td>
                            <td className="px-4 py-3 max-w-[260px]">
                              <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                {resultText}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
                              {displayVotes}
                              {isLive && displayVotes > 0 && (
                                <span className="text-text-faint text-[10px] ml-1">(실시간)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
                              {sub.final_rank ? `${sub.final_rank}위` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )
        })}
      </div>
    </div>
  )
}
