import { createServiceClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  // generations RLS는 소유자만 읽을 수 있어 service client로 전체 출품을 조회한다.
  const supabase = await createServiceClient()
  const now = new Date()

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id, submitted_at, is_seed, final_rank, final_vote_count,
      challenge_id, challenges(title, submission_start_at, submission_end_at, voting_start_at, voting_end_at),
      users(nickname),
      generations!inner(result_text)
    `)
    .order('submitted_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-1">출품·결과 모니터링</h1>
      <p className="text-sm text-text-secondary mb-5">
        PRD A-5 — 진행 중·종료 챌린지의 출품작(결과물) 목록 조회. 부정 출품 삭제는 별도 API 구현 후 연결 예정.
      </p>

      <Card className="p-3 mb-5 bg-bg-subtle border-dashed">
        <p className="text-xs text-text-muted">
          투표 중에는 사용자 화면에서 득표·순위가 숨겨집니다. 종료 후{' '}
          <code className="text-[11px]">submissions.final_rank</code> /{' '}
          <code className="text-[11px]">final_vote_count</code>에 스냅샷이 고정됩니다.
        </p>
      </Card>

      <Card className="overflow-hidden">
        {!submissions || submissions.length === 0 ? (
          <div className="p-12 text-center text-text-muted">아직 출품작이 없어요</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-border bg-bg-subtle">
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">챌린지</th>
                  <th className="px-4 py-2.5 font-semibold">작성자</th>
                  <th className="px-4 py-2.5 font-semibold">결과물</th>
                  <th className="px-4 py-2.5 font-semibold">상태</th>
                  <th className="px-4 py-2.5 font-semibold text-right">득표</th>
                  <th className="px-4 py-2.5 font-semibold text-right">순위</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  const challenge = Array.isArray(sub.challenges) ? sub.challenges[0] : sub.challenges
                  const user = Array.isArray(sub.users) ? sub.users[0] : sub.users
                  const gen = Array.isArray(sub.generations) ? sub.generations[0] : sub.generations
                  const state = challenge
                    ? getChallengeState(challenge as Parameters<typeof getChallengeState>[0], now)
                    : 'idle'
                  const votesHidden = state === 'submission' || state === 'voting'

                  return (
                    <tr key={sub.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-muted tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 text-text-primary max-w-[140px] truncate">
                        {(challenge as { title: string } | null)?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {(user as { nickname: string } | null)?.nickname ?? '알 수 없음'}
                        {sub.is_seed && <Badge variant="muted" className="ml-1.5 text-[10px]">시드</Badge>}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary max-w-[220px] truncate">
                        {(gen as { result_text: string } | null)?.result_text ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{getStateLabel(state)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                        {votesHidden && sub.final_vote_count == null
                          ? <span className="text-text-faint text-xs">숨김</span>
                          : (sub.final_vote_count ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                        {sub.final_rank ? `${sub.final_rank}위` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
