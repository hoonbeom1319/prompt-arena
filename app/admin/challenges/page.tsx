import { createClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import Link from 'next/link'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import { Button } from '@/ds/button'

export const dynamic = 'force-dynamic'

export default async function AdminChallengesPage() {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })

  // 이미 확정된 챌린지 ID 목록 — final_rank가 하나라도 있으면 확정됨
  const { data: finalizedRows } = await supabase
    .from('submissions')
    .select('challenge_id')
    .eq('is_seed', false)
    .not('final_rank', 'is', null)

  const finalizedIds = new Set(finalizedRows?.map((r) => r.challenge_id) ?? [])

  const now = new Date()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-primary">챌린지 관리</h1>
        <Button asChild variant="accent" size="sm">
          <Link href="/admin/challenges/new">새 챌린지 만들기</Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        {!challenges || challenges.length === 0 ? (
          <div className="p-12 text-center text-text-muted">아직 챌린지가 없어요</div>
        ) : (
          <div>
            {challenges.map((c, idx) => {
              const state = getChallengeState(c, now)
              const isFinalized = finalizedIds.has(c.id)
              const STATE_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'accent' | 'muted'> = {
                submission: 'success', voting: 'warning', results: 'accent', idle: 'muted',
              }
              return (
                <div
                  key={c.id}
                  className={['flex items-center gap-3 p-4', idx < challenges.length - 1 ? 'border-b border-border' : ''].join(' ')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={STATE_BADGE_VARIANT[state]} className="text-[11px]">
                        {getStateLabel(state)}
                      </Badge>
                      {isFinalized && (
                        <Badge variant="success" className="text-[11px]">확정됨</Badge>
                      )}
                      {!c.is_active && (
                        <Badge variant="muted" className="text-[11px]">비활성</Badge>
                      )}
                    </div>
                    <div className="text-[15px] font-semibold text-text-primary mb-1">{c.title}</div>
                    <div className="text-xs text-text-muted">
                      제출: {new Date(c.submission_start_at).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(c.submission_end_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/challenge/${c.id}/results`}>결과 보기</Link>
                    </Button>
                    <FinalizeButton challengeId={c.id} state={state} isFinalized={isFinalized} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function FinalizeButton({ challengeId, state, isFinalized }: { challengeId: string; state: string; isFinalized: boolean }) {
  if (state !== 'results' || isFinalized) return null
  return (
    <form action="/api/finalize" method="POST">
      <input type="hidden" name="challengeId" value={challengeId} />
      <Button type="submit" variant="accent" size="sm">결과 확정</Button>
    </form>
  )
}
