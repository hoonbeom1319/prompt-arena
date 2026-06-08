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

const STATE_LABELS: Record<ChallengeState, string> = {
  submission: '제출 중',
  voting: '투표 중',
  results: '결과 공개',
  idle: '대기 중',
}

const STATE_DOT_COLOR: Record<ChallengeState, string> = {
  submission: 'bg-success',
  voting: 'bg-warning',
  results: 'bg-accent',
  idle: 'bg-text-muted',
}

const STATE_BADGE_VARIANT: Record<ChallengeState, 'success' | 'warning' | 'accent' | 'muted'> = {
  submission: 'success',
  voting: 'warning',
  results: 'accent',
  idle: 'muted',
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
            <div className="flex flex-col items-center gap-2">
              <Badge variant="success" className="text-sm px-4 py-1.5">제출 완료</Badge>
              <Button asChild variant="secondary" size="md">
                <Link href={`/challenge/${challenge.id}/generate`}>다시 시도하기 (5회 중)</Link>
              </Button>
            </div>
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
    <div className="bg-bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8 mb-6 bg-gradient-to-br from-white to-accent-light">
      {/* State badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={STATE_BADGE_VARIANT[state]} className="gap-1.5">
          <span
            className={[
              'w-1.5 h-1.5 rounded-full inline-block',
              STATE_DOT_COLOR[state],
              state === 'submission' || state === 'voting' ? 'animate-pulse-dot' : '',
            ].join(' ')}
            aria-hidden="true"
          />
          {STATE_LABELS[state]}
        </Badge>
        <span className="text-[13px] text-text-muted">{participantCount}명 참여</span>
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-bold text-text-primary mb-3 leading-tight tracking-tight">
        {challenge.title}
      </h1>

      {/* Instruction */}
      <p className="text-base text-text-secondary leading-relaxed mb-6 max-w-[560px]">
        {challenge.instruction}
      </p>

      {/* Countdown */}
      {nextTransition && (
        <div className="inline-flex items-center gap-4 p-4 bg-white/70 rounded-lg border border-border mb-6">
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
