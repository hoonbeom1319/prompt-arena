'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/ds/button'
import { Card } from '@/ds/card'
import { cn } from '@/lib/utils'
import { MAX_VOTES } from '@/lib/constants'

interface BlindCardProps {
  submissionId: string
  resultText: string
  promptText?: string | null
  promptsUnlocked: boolean
  votesUsed: number
  hasVoted: boolean
  canVote: boolean
  voting?: boolean
  onVote: (submissionId: string) => void
}

// text-sm(14px) × leading-[1.7] × 5줄 ≈ 119px
const CLAMP_HEIGHT = 120

export default function BlindCard({
  submissionId,
  resultText,
  promptText,
  promptsUnlocked,
  votesUsed,
  hasVoted,
  canVote,
  voting = false,
  onVote,
}: BlindCardProps) {
  const shortId = submissionId.replace(/-/g, '').slice(0, 3)
  const [expanded, setExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (textRef.current) setFullHeight(textRef.current.scrollHeight)
  }, [resultText])

  const isClamped = fullHeight !== null && fullHeight > CLAMP_HEIGHT

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted px-2 py-1 bg-bg-base border border-border rounded-full">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          작성자·프롬프트 가림
        </span>
        <span className="text-xs text-text-faint">출품 #{shortId}</span>
      </div>

      {/* 프롬프트 섹션 — 항상 노출 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">프롬프트 본문</span>
          {!promptsUnlocked && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              가림
            </span>
          )}
        </div>

        {/* 잠금 상태 — 3표 완료 시 슬라이드 아웃 */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            !promptsUnlocked ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="border border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="text-sm text-text-muted">
                3표를 모두 행사하면 공개돼요 ({votesUsed}/{MAX_VOTES})
              </p>
            </div>
          </div>
        </div>

        {/* 해제 상태 — 3표 완료 시 슬라이드 인 */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            promptsUnlocked && promptText ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="p-3 bg-bg-subtle border border-border rounded-lg">
              <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">{promptText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 결과물 섹션 */}
      <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
        ✦ GEMINI 결과물
      </div>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: expanded ? `${fullHeight ?? 9999}px` : `${CLAMP_HEIGHT}px` }}
      >
        <p ref={textRef} className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
          {resultText}
        </p>
      </div>
      {isClamped && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent font-medium mt-1 hover:underline"
        >
          {expanded ? '접기' : '전체보기'}
        </button>
      )}

      <div className="mt-3">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={!canVote || hasVoted || voting}
          onClick={() => onVote(submissionId)}
        >
          {hasVoted ? '✓ 투표됨' : '✓ 투표'}
        </Button>
      </div>
    </Card>
  )
}
