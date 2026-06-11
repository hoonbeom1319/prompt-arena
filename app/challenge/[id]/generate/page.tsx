'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppBar from '@/components/AppBar'
import GenPips from '@/components/GenPips'
import { createClient } from '@/lib/supabase/client'
import { MAX_GENERATIONS } from '@/lib/constants'
import { Button } from '@/ds/button'
import { Textarea } from '@/ds/input'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

interface Generation {
  id: string
  prompt_text: string
  result_text: string
  attempt_number: number
}

interface Challenge {
  id: string
  title: string
  instruction: string
  category?: { name: string } | null
}

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = useMemo(() => createClient(), [])

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [promptText, setPromptText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenId, setSelectedGenId] = useState<string | null>(null)
  const [submittedGenId, setSubmittedGenId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [activeGenId, setActiveGenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/auth/login'); return }

      const { data: ch } = await supabase
        .from('challenges')
        .select('id, title, instruction, category_id')
        .eq('id', id)
        .single()

      if (cancelled) return
      if (!ch) { router.push('/'); return }

      const { data: gens } = await supabase
        .from('generations')
        .select('*')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })

      const { data: submission } = await supabase
        .from('submissions')
        .select('generation_id')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      let category: { name: string } | null = null
      if (ch.category_id) {
        const { data: cat } = await supabase.from('categories').select('name').eq('id', ch.category_id).single()
        if (cat) category = cat
      }
      setChallenge({ id: ch.id, title: ch.title, instruction: ch.instruction, category })
      if (gens) {
        setGenerations(gens)
        setActiveGenId(gens[0]?.id ?? null)
      }
      if (submission) setSubmittedGenId(submission.generation_id)
      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const handleGenerate = async () => {
    if (!promptText.trim()) return
    if (generations.length >= MAX_GENERATIONS) {
      setError(`최대 ${MAX_GENERATIONS}번까지만 시도할 수 있어요.`)
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, promptText: promptText.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '생성에 실패했어요. 다시 시도해주세요.')
    } else {
      setGenerations(prev => [data.generation, ...prev])
      setActiveGenId(data.generation.id)
      setPromptText('')
    }

    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedGenId) return

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, generationId: selectedGenId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '제출에 실패했어요.')
    } else {
      setSubmittedGenId(selectedGenId)
      setShowConfirm(false)
    }

    setSubmitting(false)
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <AppBar title="프롬프트 만들기" showBack backHref="/" statusLabel="제출 기간" statusVariant="accent" />
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const locked = generations.length >= MAX_GENERATIONS
  const activeGen = generations.find(g => g.id === activeGenId) ?? generations[0]

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="프롬프트 만들기" showBack backHref="/" statusLabel="제출 기간" statusVariant="accent" />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10 flex flex-col gap-3.5">
        {/* TopicBanner */}
        <Card className="p-3.5 bg-bg-subtle">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs text-text-muted whitespace-nowrap">
              주제 · {challenge?.category?.name ?? '일반'}
            </span>
            <Badge variant="outline">단독 생성형</Badge>
          </div>
          <div className="text-sm font-bold text-text-primary mb-1.5">&ldquo;{challenge?.title}&rdquo;</div>
          {challenge?.instruction && (
            <p className="text-xs text-text-secondary leading-relaxed">{challenge.instruction}</p>
          )}
        </Card>

        {submittedGenId && (
          <div role="status" className="px-4 py-3 bg-[color-mix(in_oklab,var(--success)_12%,white)] border border-[color-mix(in_oklab,var(--success)_32%,white)] rounded-lg text-success text-sm font-medium">
            제출 완료! 이미 이 챌린지에 프롬프트를 제출했어요.
          </div>
        )}

        {/* 결과물 — run control 위 */}
        {generations.length === 0 ? (
          <Card className="p-8 text-center text-text-faint">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm mt-2">실행하면 결과물이 여기에 표시돼요</p>
          </Card>
        ) : activeGen && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[15px] font-semibold text-text-primary">
                  결과물 · 시도 {activeGen.attempt_number}
                </span>
                {activeGen.id === generations[0]?.id && <Badge variant="accent">최신</Badge>}
              </div>
              <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
                ✦ GEMINI 결과물
              </div>
              <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
                {activeGen.result_text}
              </p>
            </Card>

            {!submittedGenId && (
              <div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  시도 기록 — 하나 골라 제출
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {generations.map(gen => (
                    <button
                      key={gen.id}
                      type="button"
                      onClick={() => setActiveGenId(gen.id)}
                      className={[
                        'shrink-0 w-[130px] text-left p-3 rounded-lg border bg-bg-card transition-colors',
                        activeGenId === gen.id
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-border-strong',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <b className="text-xs">시도 {gen.attempt_number}</b>
                        {activeGenId === gen.id && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-text-muted leading-snug h-[54px] overflow-hidden">
                        {gen.result_text.slice(0, 46)}…
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Run control — 결과물 아래 */}
        {!submittedGenId && (
          <>
            <Card className="p-4 flex flex-col gap-2.5">
              <Textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder={locked ? '5회를 모두 사용해 생성이 잠겼어요' : '프롬프트를 입력하세요…'}
                disabled={loading || locked}
                rows={4}
                aria-label="프롬프트 입력"
                className="min-h-[90px]"
              />
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={loading || !promptText.trim() || locked}
                className="w-full"
              >
                {locked ? '생성 잠금 (5/5)' : loading ? '실행 중...' : '⚡ 실행 (Gemini)'}
              </Button>
            </Card>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">남은 생성 횟수</span>
              <span className="flex items-center gap-2">
                <GenPips used={generations.length} />
                <b className="text-xs tabular-nums">{generations.length}/{MAX_GENERATIONS}</b>
              </span>
            </div>

            {error && <p role="alert" className="text-sm text-error">{error}</p>}

            {generations.length > 0 && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  if (activeGenId) {
                    setSelectedGenId(activeGenId)
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 bg-black/45 flex items-end md:items-center justify-center z-[200] p-4"
          >
            <Card className="p-6 max-w-[430px] w-full rounded-t-xl md:rounded-xl animate-[sheet-up_240ms_var(--ease-spring)]">
              <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-4 md:hidden" />
              <h3 id="confirm-title" className="text-lg font-bold mb-2">제출하면 수정·삭제할 수 없어요</h3>
              <p className="text-sm text-text-secondary mb-5 leading-relaxed">
                계속할까요? 선택한 결과물로 챌린지에 참여하게 됩니다.
              </p>
              <div className="flex gap-2.5">
                <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">
                  취소
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? '제출 중...' : '제출 확정'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
