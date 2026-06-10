'use client'

import Link from 'next/link'
import CountdownTimer from './CountdownTimer'
import { ChallengeState, getNextTransition, Challenge } from '@/lib/challenge-state'
import { Button } from '@/ds/button'
import { Badge } from '@/ds/badge'

interface ChallengeHeroProps {
  challenge: Challenge
  state: ChallengeState
  participantCount: number
  userSubmission?: { id: string } | null
  userId?: string | null
}

export default function ChallengeHero({
  challenge,
  state,
  participantCount,
  userSubmission,
  userId,
}: ChallengeHeroProps) {
  const nextTransition = getNextTransition(challenge)

  const renderCTA = () => {
    if (!userId) {
      return (
        <Button asChild variant="accent" size="lg">
          <Link href="/auth/login">로그인하고 참여하기</Link>
        </Button>
      )
    }

    switch (state) {
      case 'submission':
        if (userSubmission) {
          return (
            <Badge variant="success" className="text-sm px-4 py-1.5">제출 완료</Badge>
          )
        }
        return (
          <Button asChild variant="accent" size="lg">
            <Link href={`/challenge/${challenge.id}/generate`}>프롬프트 만들기</Link>
          </Button>
        )

      case 'voting':
        return (
          <Button asChild variant="accent" size="lg">
            <Link href={`/challenge/${challenge.id}/vote`}>투표하러 가기</Link>
          </Button>
        )

      case 'results':
        return (
          <Button asChild variant="primary" size="lg">
            <Link href={`/challenge/${challenge.id}/results`}>결과 보기</Link>
          </Button>
        )

      case 'idle':
        return (
          <Button variant="secondary" size="lg" disabled>
            대기 중...
          </Button>
        )
    }
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg shadow-[var(--shadow-sm)] p-6 mb-5">
      {/* Phase strip */}
      <div className="flex items-center gap-2 mb-5">
        {(['submission', 'voting', 'results'] as const).map((ph, i) => {
          const isDone = (state === 'voting' && ph === 'submission') ||
                         (state === 'results' && ph !== 'results')
          const isNow = state === ph
          return (
            <div key={ph} className="flex items-center gap-2">
              {i > 0 && <span className="text-border-strong text-xs">›</span>}
              <div className={[
                'inline-flex items-center gap-1.5 text-xs font-semibold',
                isNow ? 'text-accent' : isDone ? 'text-text-muted' : 'text-text-faint',
              ].join(' ')}>
                <span className={[
                  'w-2 h-2 rounded-full',
                  isNow ? 'bg-accent shadow-[0_0_0_3px_var(--accent-light)]' :
                  isDone ? 'bg-success' : 'bg-border-strong',
                ].join(' ')} aria-hidden="true" />
                {{ submission: '제출', voting: '투표', results: '결과' }[ph]}
              </div>
            </div>
          )
        })}
        <span className="ml-auto text-[13px] text-text-muted">{participantCount}명 참여</span>
      </div>

      {/* Title */}
      <h1 className="text-[22px] font-extrabold text-text-primary mb-2 leading-tight tracking-tight">
        &ldquo;{challenge.title}&rdquo;
      </h1>

      {/* Instruction */}
      <p className="text-[13px] text-text-secondary leading-relaxed mb-5 max-w-[560px]">
        {challenge.instruction}
      </p>

      {/* Countdown */}
      {nextTransition && (
        <div className="inline-flex items-center gap-3 px-4 py-3 bg-bg-subtle rounded-md border border-border mb-5">
          <CountdownTimer
            targetTime={nextTransition.time.toISOString()}
            label={nextTransition.label + ' 까지'}
          />
        </div>
      )}

      {/* CTA */}
      <div>{renderCTA()}</div>
    </div>
  )
}
