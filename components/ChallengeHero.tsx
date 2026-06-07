'use client'

import Link from 'next/link'
import CountdownTimer from './CountdownTimer'
import { ChallengeState, getNextTransition, Challenge } from '@/lib/challenge-state'

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

const STATE_COLORS: Record<ChallengeState, string> = {
  submission: '#10B981',
  voting: '#F59E0B',
  results: '#D97757',
  idle: '#6B7280',
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
        <Link href="/auth/login" className="btn-accent" style={{ fontSize: '16px', padding: '12px 28px' }}>
          로그인하고 참여하기
        </Link>
      )
    }

    switch (state) {
      case 'submission':
        if (userSubmission) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="badge badge-success" style={{ fontSize: '14px', padding: '6px 16px' }}>
                제출 완료
              </div>
              <Link
                href={`/challenge/${challenge.id}/generate`}
                className="btn-secondary"
                style={{ fontSize: '14px' }}
              >
                다시 시도하기 (5회 중)
              </Link>
            </div>
          )
        }
        return (
          <Link href={`/challenge/${challenge.id}/generate`} className="btn-accent" style={{ fontSize: '16px', padding: '12px 28px' }}>
            프롬프트 만들기
          </Link>
        )

      case 'voting':
        return (
          <Link href={`/challenge/${challenge.id}/vote`} className="btn-accent" style={{ fontSize: '16px', padding: '12px 28px' }}>
            투표하러 가기
          </Link>
        )

      case 'results':
        return (
          <Link href={`/challenge/${challenge.id}/results`} className="btn-primary" style={{ fontSize: '16px', padding: '12px 28px' }}>
            결과 보기
          </Link>
        )

      case 'idle':
        return (
          <button disabled className="btn-secondary" style={{ fontSize: '16px', padding: '12px 28px', cursor: 'not-allowed', opacity: 0.6 }}>
            대기 중...
          </button>
        )
    }
  }

  return (
    <div className="card" style={{
      padding: '32px',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF0EB 100%)',
    }}>
      {/* State badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: `${STATE_COLORS[state]}20`,
          color: STATE_COLORS[state],
          fontSize: '12px',
          fontWeight: '600',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: STATE_COLORS[state],
            display: 'inline-block',
            animation: state === 'submission' || state === 'voting' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
          }} />
          {STATE_LABELS[state]}
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {participantCount}명 참여
        </span>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '12px',
        lineHeight: '1.3',
        letterSpacing: '-0.02em',
      }}>
        {challenge.title}
      </h1>

      {/* Instruction */}
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        marginBottom: '24px',
        maxWidth: '560px',
      }}>
        {challenge.instruction}
      </p>

      {/* Countdown */}
      {nextTransition && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
          width: 'fit-content',
        }}>
          <CountdownTimer
            targetTime={nextTransition.time.toISOString()}
            label={nextTransition.label + ' 까지'}
          />
        </div>
      )}

      {/* CTA */}
      <div>
        {renderCTA()}
      </div>
    </div>
  )
}
