import { createClient } from '@/lib/supabase/server'
import { getChallengeState, getStateLabel } from '@/lib/challenge-state'
import Header from '@/components/Header'
import Link from 'next/link'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const now = new Date()

  interface ChallengeWithCount {
    id: string
    title: string
    instruction: string
    submission_start_at: string
    submission_end_at: string
    voting_start_at: string
    voting_end_at: string
    model_name: string
    temperature: number
    wrapper_text: string | null
    created_by: string
    is_active: boolean
    created_at: string
    category_id: string | null
    challenge_type: string
    participantCount: number
    state: string
  }

  const challengesWithCounts: ChallengeWithCount[] = []

  if (challenges) {
    for (const c of challenges) {
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', c.id)
      challengesWithCounts.push({
        ...c,
        participantCount: count ?? 0,
        state: getChallengeState(c, now),
      })
    }
  }

  const STATE_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'accent' | 'muted'> = {
    submission: 'success',
    voting: 'warning',
    results: 'accent',
    idle: 'muted',
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Header />

      <main className="container pt-8 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">아카이브</h1>
          <p className="text-sm text-text-secondary">지금까지의 모든 챌린지를 확인해보세요</p>
        </div>

        {challengesWithCounts.length === 0 ? (
          <Card className="p-16 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">📭</div>
            <p className="text-base text-text-muted">아직 챌린지가 없어요.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {challengesWithCounts.map(challenge => {
              const href = challenge.state === 'results'
                ? `/challenge/${challenge.id}/results`
                : challenge.state === 'voting'
                ? `/challenge/${challenge.id}/vote`
                : challenge.state === 'submission'
                ? `/challenge/${challenge.id}/generate`
                : `/challenge/${challenge.id}/results`

              return (
                <Link
                  key={challenge.id}
                  href={href}
                  className="block no-underline group"
                >
                  <Card className="p-5 transition-shadow group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Badge variant={STATE_BADGE_VARIANT[challenge.state] ?? 'muted'} className="mb-2">
                          {getStateLabel(challenge.state as 'submission' | 'voting' | 'results' | 'idle')}
                        </Badge>

                        <h2 className="text-base font-semibold text-text-primary mb-1.5 leading-snug">
                          {challenge.title}
                        </h2>
                        <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
                          {challenge.instruction.length > 100
                            ? challenge.instruction.substring(0, 100) + '...'
                            : challenge.instruction}
                        </p>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-text-muted">{challenge.participantCount}명 참여</span>
                          <span className="text-xs text-text-muted">
                            {new Date(challenge.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>

                      <span className="text-xl text-text-muted" aria-hidden="true">→</span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
