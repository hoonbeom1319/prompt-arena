'use client'

import { useState } from 'react'

interface AiSummaryProps {
  summary: string
}

// AI 중립 요약 (PRD v1.1 4.6.4) — 평가가 아닌 색인.
// 기본 표시, 접기 가능(원문으로만 판단하고 싶은 사용자 배려).
// 점수처럼 보이지 않게 작고 차분한 톤으로.
export default function AiSummary({ summary }: AiSummaryProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="px-3 py-2.5 bg-bg-subtle border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          AI 요약 <span className="font-normal normal-case">· 평가가 아닌 색인이에요</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-text-muted hover:underline"
          aria-expanded={open}
        >
          {open ? '접기' : '펼치기'}
        </button>
      </div>
      {open && (
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
