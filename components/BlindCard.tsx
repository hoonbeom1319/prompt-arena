'use client'

import { useEffect, useRef, useState } from 'react'
import AiSummary from '@/components/AiSummary'
import { Button } from '@/ds/button'
import { Card } from '@/ds/card'
import { cn } from '@/lib/utils'
import { MAX_VOTES } from '@/lib/constants'

interface BlindCardProps {
  submissionId: string
  resultText: string
  aiSummary?: string | null
  promptText?: string | null
  promptsUnlocked: boolean
  votesUsed: number
  hasVoted: boolean
  canVote: boolean
  voting?: boolean
  onVote: (submissionId: string) => void
  // 결과물 펼침 상태는 부모가 관리한다 — 한 번에 하나만 펼치는 아코디언 동작.
  expanded: boolean
  onToggleExpand: (submissionId: string) => void
}

// text-sm(14px) × leading-[1.7] × 5줄 ≈ 119px
const CLAMP_HEIGHT = 120

export default function BlindCard({
  submissionId,
  resultText,
  aiSummary,
  promptText,
  promptsUnlocked,
  votesUsed,
  hasVoted,
  canVote,
  voting = false,
  onVote,
  expanded,
  onToggleExpand,
}: BlindCardProps) {
  const shortId = submissionId.replace(/-/g, '').slice(0, 3)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [promptFullHeight, setPromptFullHeight] = useState<number | null>(null)
  const promptRef = useRef<HTMLParagraphElement>(null)

  // 마운트 시 1회 측정은 display:none(데스크탑 md:hidden)·폰트 로딩 중이면 0으로 잰다.
  // ResizeObserver로 보이게 되거나 크기가 바뀔 때마다 재측정해야 정확하다.
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const measure = () => setFullHeight(el.scrollHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [resultText])

  useEffect(() => {
    const el = promptRef.current
    if (!el) return
    const measure = () => setPromptFullHeight(el.scrollHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [promptText, promptsUnlocked])

  const isClamped = fullHeight !== null && fullHeight > CLAMP_HEIGHT
  const isPromptClamped = promptFullHeight !== null && promptFullHeight > CLAMP_HEIGHT

  return (
    <Card className="p-4">
      {/* AI 중립 요약 — 기본 표시, 접기 가능. 없으면(생성 실패) 결과물만 표시 */}
      {aiSummary && (
        <div className="mb-3">
          <AiSummary summary={aiSummary} />
        </div>
      )}

      {/* 프롬프트 섹션 — 항상 노출 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">프롬프트 본문</span>
          <div className="flex items-center gap-2">
            {!promptsUnlocked && (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                가림
              </span>
            )}
            <span className="text-xs text-text-faint">출품 #{shortId}</span>
          </div>
        </div>

        {/* 잠금 상태 — 3표 완료 시 슬라이드 아웃 */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            !promptsUnlocked ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div
              className="border border-dashed border-border rounded-lg py-5 flex flex-col items-center gap-2"
              style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)' }}
            >
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
              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: promptExpanded ? (promptFullHeight ? `${promptFullHeight}px` : 'none') : `${CLAMP_HEIGHT}px` }}
              >
                <p ref={promptRef} className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">{promptText}</p>
              </div>
              {isPromptClamped && (
                <button
                  onClick={() => setPromptExpanded(!promptExpanded)}
                  className="text-xs text-accent font-medium mt-1 hover:underline"
                >
                  {promptExpanded ? '접기' : '전체보기'}
                </button>
              )}
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
        style={{ maxHeight: expanded ? (fullHeight ? `${fullHeight}px` : 'none') : `${CLAMP_HEIGHT}px` }}
      >
        <p ref={textRef} className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
          {resultText}
        </p>
      </div>
      {isClamped && (
        <button
          onClick={() => onToggleExpand(submissionId)}
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
