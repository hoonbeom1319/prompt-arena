'use client'

import Link from 'next/link'
import { Button } from '@/ds/button'
import { Card } from '@/ds/card'

interface BlindCardProps {
  submissionId: string
  challengeId: string
  resultText: string
  hasVoted: boolean
  canVote: boolean
  voting?: boolean
  onVote: (submissionId: string) => void
}

export default function BlindCard({
  submissionId,
  challengeId,
  resultText,
  hasVoted,
  canVote,
  voting = false,
  onVote,
}: BlindCardProps) {
  const shortId = submissionId.replace(/-/g, '').slice(0, 3)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted px-2 py-1 bg-bg-base border border-border rounded-full">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          작성자·프롬프트 가림
        </span>
        <span className="text-xs text-text-faint">출품 #{shortId}</span>
      </div>

      <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
        ✦ GEMINI 결과물
      </div>
      <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap mb-3">
        {resultText}
      </p>

      <div className="flex gap-2">
        <Button asChild variant="secondary" size="sm" className="flex-1">
          <Link href={`/challenge/${challengeId}/vote?detail=${submissionId}`}>자세히</Link>
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          disabled={!canVote || hasVoted || voting}
          onClick={() => onVote(submissionId)}
        >
          {hasVoted ? '✓ 투표됨' : '✓ 투표'}
        </Button>
      </div>
    </Card>
  )
}
