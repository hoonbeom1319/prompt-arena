'use client'

import { useState } from 'react'
import AiSummary from '@/components/AiSummary'
import BlindCard from '@/components/BlindCard'
import GeminiOutputLabel from '@/components/GeminiOutputLabel'
import VoteTokens from '@/components/VoteTokens'
import { MAX_VOTES } from '@/lib/constants'
import { Card } from '@/ds/card'
import { Button } from '@/ds/button'
import { cn } from '@/lib/utils'
import { IconCheck, IconLock } from '@/ds/icons'
import { useVoting } from './useVoting'

interface VoteClientProps {
  challengeId: string
  challengeTitle: string
}

// 투표 인터랙션만 담당하는 클라이언트 island. 인증·챌린지는 서버 컴포넌트가 보장.
// 상태 머신·목록·투표는 useVoting 훅이 /api/vote로 처리 — supabase 직접 호출 없음 (ARCHITECTURE §2·§4).
export default function VoteClient({ challengeId, challengeTitle }: VoteClientProps) {
  const v = useVoting(challengeId)

  // 마스터-디테일 선택(데스크탑)·아코디언 펼침(모바일)은 순수 UI 상태 — 컴포넌트에 잔류.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const selected = v.submissions.find(s => s.id === selectedId) ?? v.submissions[0]

  if (v.pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
        <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <main className="max-w-[430px] md:max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-24 flex flex-col gap-3.5">
        <h2 className="hidden md:block text-lg font-bold text-text-primary tracking-tight">
          &ldquo;{challengeTitle}&rdquo;
        </h2>

        <Card className={['p-3', v.promptsUnlocked ? 'bg-accent-light border-accent-mid' : ''].join(' ')}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              내 투표 <b className="tabular-nums">{v.votesUsed}/{MAX_VOTES}</b>
            </span>
            <VoteTokens used={v.votesUsed} />
          </div>
          <p className={['text-xs', v.promptsUnlocked ? 'text-accent' : 'text-text-muted'].join(' ')}>
            {v.promptsUnlocked
              ? '✓ 3표 완료 — 전체 프롬프트 열람이 해제됐어요'
              : '3표를 모두 쓰면 전체 프롬프트가 공개돼요'}
          </p>
          {!v.promptsUnlocked && (
            // 투표 피로도 완화 (PRD v1.1 4.6.2) — "전부 정독해야 할 것 같은 압박" 제거
            <p className="text-xs text-text-muted mt-0.5">
              마음에 드는 것에만 투표하세요. 전부 볼 필요 없어요.
            </p>
          )}
        </Card>

        {v.error && (
          <div role="alert" className="px-4 py-3 bg-[color-mix(in_oklab,var(--error)_12%,white)] border border-[color-mix(in_oklab,var(--error)_32%,white)] rounded-lg text-error text-sm">
            {v.error}
          </div>
        )}

        {v.submissions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-base text-text-muted">아직 제출된 프롬프트가 없어요.</p>
          </Card>
        ) : (
          <>
            {/* 모바일 — 카드 리스트 */}
            <div className="flex flex-col gap-3.5 md:hidden">
              {v.submissions.map(sub => (
                <BlindCard
                  key={sub.id}
                  submissionId={sub.id}
                  resultText={sub.result_text}
                  aiSummary={sub.ai_summary}
                  promptText={sub.prompt_text}
                  promptsUnlocked={v.promptsUnlocked}
                  votesUsed={v.votesUsed}
                  hasVoted={v.hasVoted(sub.id)}
                  canVote={v.votesUsed < MAX_VOTES}
                  voting={v.voting}
                  onVote={v.vote}
                  expanded={expandedId === sub.id}
                  onToggleExpand={(sid) => setExpandedId(prev => (prev === sid ? null : sid))}
                />
              ))}
            </div>

            {/* 데스크탑 — 마스터-디테일 */}
            <div className="hidden md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-4 md:items-start">
              <nav
                className="flex flex-col gap-2 md:sticky md:top-[68px] md:max-h-[calc(100vh-84px)] md:overflow-y-auto"
                aria-label="출품작 목록"
              >
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1">
                  출품작 {v.submissions.length}
                </div>
                {v.submissions.map((sub, i) => {
                  const active = selected?.id === sub.id
                  const hasVoted = v.hasVoted(sub.id)
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedId(sub.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'relative w-full text-left p-3.5 rounded-lg border bg-bg-card flex gap-2.5 transition-colors',
                        active
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-border-strong',
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-bold tabular-nums mt-0.5',
                          active ? 'text-accent' : 'text-text-muted',
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={cn('flex-1 min-w-0', hasVoted && 'pr-4')}>
                        {/* 색인 용도라 요약이 있으면 결과물 대신 요약으로 훑게 한다 (PRD v1.1 4.6.4) */}
                        <span className="line-clamp-2 text-sm text-text-primary leading-snug">
                          {sub.ai_summary || sub.result_text}
                        </span>
                      </span>
                      {hasVoted && (
                        <span
                          className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center"
                          aria-label="투표한 출품작"
                          title="투표함"
                        >
                          <IconCheck width={10} height={10} strokeWidth={3} className="text-white" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              {selected && (
                <Card className="p-5 flex flex-col gap-4">
                  {/* AI 중립 요약 — 기본 표시, 접기 가능 */}
                  {selected.ai_summary && <AiSummary key={selected.id} summary={selected.ai_summary} />}

                  {/* 프롬프트 본문 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-text-primary">프롬프트 본문</span>
                      <span className="text-xs text-text-faint">
                        출품 #{selected.id.replace(/-/g, '').slice(0, 3)}
                      </span>
                    </div>
                    {v.promptsUnlocked && selected.prompt_text ? (
                      <div className="p-3.5 bg-bg-subtle border border-border rounded-lg">
                        <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
                          {selected.prompt_text}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="border border-dashed border-border rounded-lg py-5 flex flex-col items-center gap-2"
                        style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)' }}
                      >
                        <IconLock strokeWidth={1.5} className="text-text-muted" />
                        <p className="text-sm text-text-muted">
                          3표를 모두 행사하면 공개돼요 ({v.votesUsed}/{MAX_VOTES})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 결과물 전문 */}
                  <div>
                    <GeminiOutputLabel className="mb-2" />
                    <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
                      {selected.result_text}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      {/* 데스크탑 전용 — fixed 투표 버튼 */}
      {selected && (
        <div className="hidden md:block fixed bottom-0 left-0 right-0 z-20 bg-bg-base/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-[300px_minmax(0,1fr)] gap-4">
            <div />
            <Button
              variant="primary"
              className="w-full"
              disabled={
                v.hasVoted(selected.id)
                || v.votesUsed >= MAX_VOTES
                || v.voting
              }
              onClick={() => v.vote(selected.id)}
            >
              {v.hasVoted(selected.id) ? '✓ 투표됨' : '✓ 이 답변에 투표'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
