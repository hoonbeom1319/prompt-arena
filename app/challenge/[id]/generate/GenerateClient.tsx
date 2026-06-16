'use client'

import { useState } from 'react'
import GenPips from '@/components/GenPips'
import { MAX_GENERATIONS } from '@/lib/constants'
import { Button } from '@/ds/button'
import { Textarea } from '@/ds/input'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import Modal from '@/ds/modal'
import { IconZap, IconCheck } from '@/ds/icons'
import { useGeneration, type Generation } from './useGeneration'

interface GenerateClientProps {
  challengeId: string
  challenge: { title: string; instruction: string; category: string | null }
  initialGenerations: Generation[]
  initialSubmittedGenId: string | null
}

// 생성·제출만 담당하는 클라이언트 island. 데이터 읽기는 서버 컴포넌트(page.tsx)에서 props로 받는다.
// 상태 머신·쓰기는 useGeneration 훅이 /api 경유로 처리 — supabase 직접 호출 없음 (ARCHITECTURE §2·§4).
export default function GenerateClient({
  challengeId,
  challenge,
  initialGenerations,
  initialSubmittedGenId,
}: GenerateClientProps) {
  const gen = useGeneration(challengeId, {
    generations: initialGenerations,
    submittedGenId: initialSubmittedGenId,
  })

  // 확인 모달은 사용자 인터랙션으로 열리는 순수 UI 상태 — 컴포넌트에 잔류.
  const [selectedGenId, setSelectedGenId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async () => {
    if (!selectedGenId) return
    const ok = await gen.submit(selectedGenId)
    if (ok) setShowConfirm(false)
  }

  return (
    <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10 flex flex-col gap-3.5">
      {/* TopicBanner */}
      <Card className="p-3.5 bg-bg-subtle">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs text-text-muted whitespace-nowrap">
            주제 · {challenge.category ?? '일반'}
          </span>
          <Badge variant="outline">단독 생성형</Badge>
        </div>
        <div className="text-sm font-bold text-text-primary mb-1.5">&ldquo;{challenge.title}&rdquo;</div>
        {challenge.instruction && (
          <p className="text-xs text-text-secondary leading-relaxed">{challenge.instruction}</p>
        )}
      </Card>

      {gen.submittedGenId && (
        <div role="status" className="px-4 py-3 bg-[color-mix(in_oklab,var(--success)_12%,white)] border border-[color-mix(in_oklab,var(--success)_32%,white)] rounded-lg text-success text-sm font-medium">
          제출 완료! 이미 이 챌린지에 프롬프트를 제출했어요.
        </div>
      )}

      {/* 결과물 — run control 위 */}
      {gen.generations.length === 0 ? (
        <Card className="p-8 text-center text-text-faint">
          <IconZap className="mx-auto" />
          <p className="text-sm mt-2">실행하면 결과물이 여기에 표시돼요</p>
        </Card>
      ) : gen.activeGen && (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[15px] font-semibold text-text-primary">
                결과물 · 시도 {gen.activeGen.attempt_number}
              </span>
              {gen.activeGen.id === gen.generations[0]?.id && <Badge variant="accent">최신</Badge>}
            </div>
            {gen.activeGen.prompt_text && (
              <div className="mb-3">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  내가 보낸 프롬프트
                </div>
                <p className="text-sm text-text-secondary leading-[1.7] whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
                  {gen.activeGen.prompt_text}
                </p>
              </div>
            )}
            <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
              ✦ GEMINI 결과물
            </div>
            <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
              {gen.activeGen.result_text}
            </p>
          </Card>

          {!gen.submittedGenId && (
            <div>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                시도 기록 — 하나 골라 제출
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {gen.generations.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => gen.setActiveGenId(g.id)}
                    className={[
                      'shrink-0 w-[130px] text-left p-3 rounded-lg border bg-bg-card transition-colors',
                      gen.activeGenId === g.id
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-border-strong',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <b className="text-xs">시도 {g.attempt_number}</b>
                      {gen.activeGenId === g.id && (
                        <IconCheck width={14} height={14} className="text-accent" />
                      )}
                    </div>
                    <div className="text-xs text-text-muted leading-snug h-[54px] overflow-hidden">
                      {g.result_text.slice(0, 46)}…
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Run control — 결과물 아래 */}
      {!gen.submittedGenId && (
        <>
          <Card className="p-4 flex flex-col gap-2.5">
            <Textarea
              value={gen.promptText}
              onChange={e => gen.setPromptText(e.target.value)}
              placeholder={gen.locked ? `${MAX_GENERATIONS}회를 모두 사용해 생성이 잠겼어요` : '프롬프트를 입력하세요…'}
              disabled={gen.loading || gen.locked}
              rows={4}
              aria-label="프롬프트 입력"
              className="min-h-[90px]"
            />
            <Button
              variant="primary"
              onClick={gen.generate}
              disabled={gen.loading || !gen.promptText.trim() || gen.locked}
              className="w-full"
            >
              {gen.locked ? `생성 잠금 (${MAX_GENERATIONS}/${MAX_GENERATIONS})` : gen.loading ? '실행 중...' : '⚡ 실행 (Gemini)'}
            </Button>
          </Card>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">남은 생성 횟수</span>
            <span className="flex items-center gap-2">
              <GenPips used={gen.generations.length} />
              <b className="text-xs tabular-nums">{gen.generations.length}/{MAX_GENERATIONS}</b>
            </span>
          </div>

          {gen.error && <p role="alert" className="text-sm text-error">{gen.error}</p>}

          {gen.generations.length > 0 && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                if (gen.activeGenId) {
                  setSelectedGenId(gen.activeGenId)
                  setShowConfirm(true)
                }
              }}
            >
              이 시도 제출하기
            </Button>
          )}
        </>
      )}

      {showConfirm && selectedGenId && (
        <Modal
          onClose={() => setShowConfirm(false)}
          labelledBy="confirm-title"
          placement="sheet"
          className="p-6 max-w-[430px]"
        >
          <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-4 md:hidden" />
          <h3 id="confirm-title" className="text-lg font-bold mb-2">제출하면 수정·삭제할 수 없어요</h3>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            계속할까요? 선택한 결과물로 챌린지에 참여하게 됩니다.
          </p>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">
              취소
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={gen.submitting} className="flex-1">
              {gen.submitting ? '제출 중...' : '제출 확정'}
            </Button>
          </div>
        </Modal>
      )}
    </main>
  )
}
