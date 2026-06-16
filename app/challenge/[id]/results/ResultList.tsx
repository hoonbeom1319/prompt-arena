'use client'

import { useState } from 'react'
import RankBadge from '@/components/RankBadge'
import GeminiOutputLabel from '@/components/GeminiOutputLabel'
import { IconChevronDown } from '@/ds/icons'
import { cn } from '@/lib/utils'

interface RankedSub {
  id: string
  rank: number
  final_vote_count: number
  result_text: string
  prompt_text: string
  attemptNumber: number
  isMe?: boolean
}

function anonLabel(id: string) {
  return id.replace(/-/g, '').slice(0, 3)
}

export default function ResultList({ subs }: { subs: RankedSub[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  // 같은 득표수가 존재하는 항목 집합 — 시도 횟수 표시 여부 결정용
  const tiedVoteCounts = new Set(
    subs
      .map(s => s.final_vote_count)
      .filter((v, _, arr) => arr.filter(x => x === v).length > 1)
  )

  return (
    <div className="flex flex-col gap-1.5">
      {subs.map(sub => {
        const isOpen = openId === sub.id
        return (
          <div
            key={sub.id}
            className={cn(
              'border rounded-md bg-bg-card overflow-hidden',
              sub.isMe ? 'border-accent-mid' : 'border-border',
            )}
          >
            <button
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left',
                sub.isMe && 'bg-accent-light'
              )}
              onClick={() => setOpenId(isOpen ? null : sub.id)}
            >
              <RankBadge rank={sub.rank} />
              <span className="text-sm flex-1 truncate">
                익명#{anonLabel(sub.id)}
                {sub.isMe && <span className="text-xs text-text-faint"> · 나</span>}
              </span>
              <span className="text-right leading-tight">
                <b className="text-sm tabular-nums">{sub.final_vote_count}표</b>
                {tiedVoteCounts.has(sub.final_vote_count) && (
                  <span className="block text-[10px] text-text-faint tabular-nums">{sub.attemptNumber}회 시도</span>
                )}
              </span>
              <IconChevronDown
                className={cn('text-text-muted transition-transform duration-200 shrink-0', isOpen && 'rotate-180')}
              />
            </button>

            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t border-border">
                  <div>
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      프롬프트
                    </div>
                    <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap p-3 bg-bg-subtle border border-border rounded-md">
                      {sub.prompt_text}
                    </p>
                  </div>
                  <div>
                    <GeminiOutputLabel className="mb-1.5" />
                    <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap p-3 bg-bg-subtle border border-border rounded-md">
                      {sub.result_text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
