'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppBar from '@/components/AppBar'
import BlindCard from '@/components/BlindCard'
import VoteTokens from '@/components/VoteTokens'
import { createClient } from '@/lib/supabase/client'
import { MAX_VOTES } from '@/lib/constants'
import { Card } from '@/ds/card'
import { Button } from '@/ds/button'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  result_text: string
  prompt_text?: string | null
}

interface VoteState {
  submissionId: string
}

interface Challenge {
  id: string
  title: string
}

export default function VotePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = useMemo(() => createClient(), [])

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [myVotes, setMyVotes] = useState<VoteState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/auth/login'); return }

      const { data: ch } = await supabase
        .from('challenges')
        .select('id, title')
        .eq('id', id)
        .single()

      if (cancelled) return
      if (!ch) { router.push('/'); return }

      const res = await fetch(`/api/vote?challengeId=${id}`)
      const data = await res.json()

      if (cancelled) return

      setChallenge(ch)

      if (res.ok) {
        setSubmissions(data.submissions.map((s: { id: string; result_text: string; prompt_text?: string | null }) => ({
          id: s.id,
          result_text: s.result_text,
          prompt_text: s.prompt_text ?? null,
        })))
        setMyVotes(data.votedSubmissionIds.map((sid: string) => ({ submissionId: sid })))
        if (data.revealed) setRevealed(true)
      } else {
        setError(data.error || '목록을 불러오지 못했어요.')
      }

      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const handleVote = async (submissionId: string) => {
    if (myVotes.some(v => v.submissionId === submissionId)) return
    if (myVotes.length >= MAX_VOTES) return

    setVoting(true)
    setError(null)

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: id, submissionId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '투표에 실패했어요.')
    } else {
      const newVotes = [...myVotes, { submissionId }]
      setMyVotes(newVotes)
      if (newVotes.length >= MAX_VOTES) {
        setRevealed(true)
        const revealRes = await fetch(`/api/vote?challengeId=${id}`)
        const revealData = await revealRes.json()
        if (revealRes.ok && revealData.revealed) {
          setSubmissions(revealData.submissions.map((s: { id: string; result_text: string; prompt_text?: string | null }) => ({
            id: s.id,
            result_text: s.result_text,
            prompt_text: s.prompt_text ?? null,
          })))
        }
      }
    }

    setVoting(false)
  }

  const votesUsed = myVotes.length
  const promptsUnlocked = revealed || votesUsed >= MAX_VOTES
  const selected = submissions.find(s => s.id === selectedId) ?? submissions[0]

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <AppBar title="투표" showBack backHref="/" statusLabel="투표 기간" statusVariant="accent" />
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="투표" showBack backHref="/" statusLabel="투표 기간" statusVariant="accent" />

      <main className="max-w-[430px] md:max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10 flex flex-col gap-3.5">
        {challenge && (
          <h2 className="hidden md:block text-lg font-bold text-text-primary tracking-tight">
            &ldquo;{challenge.title}&rdquo;
          </h2>
        )}

        <Card className={['p-3', promptsUnlocked ? 'bg-accent-light border-accent-mid' : ''].join(' ')}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              내 투표 <b className="tabular-nums">{votesUsed}/{MAX_VOTES}</b>
            </span>
            <VoteTokens used={votesUsed} />
          </div>
          <p className={['text-xs', promptsUnlocked ? 'text-accent' : 'text-text-muted'].join(' ')}>
            {promptsUnlocked
              ? '✓ 3표 완료 — 전체 프롬프트 열람이 해제됐어요'
              : '3표를 모두 쓰면 전체 프롬프트가 공개돼요'}
          </p>
        </Card>

        {error && (
          <div role="alert" className="px-4 py-3 bg-[color-mix(in_oklab,var(--error)_12%,white)] border border-[color-mix(in_oklab,var(--error)_32%,white)] rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {submissions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-base text-text-muted">아직 제출된 프롬프트가 없어요.</p>
          </Card>
        ) : (
          <>
            {/* 모바일 — 카드 리스트 */}
            <div className="flex flex-col gap-3.5 md:hidden">
              {submissions.map(sub => (
                <BlindCard
                  key={sub.id}
                  submissionId={sub.id}
                  resultText={sub.result_text}
                  promptText={sub.prompt_text}
                  promptsUnlocked={promptsUnlocked}
                  votesUsed={votesUsed}
                  hasVoted={myVotes.some(v => v.submissionId === sub.id)}
                  canVote={votesUsed < MAX_VOTES}
                  voting={voting}
                  onVote={handleVote}
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
                  출품작 {submissions.length}
                </div>
                {submissions.map((sub, i) => {
                  const active = selected?.id === sub.id
                  const hasVoted = myVotes.some(v => v.submissionId === sub.id)
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
                        <span className="line-clamp-2 text-sm text-text-primary leading-snug">
                          {sub.result_text}
                        </span>
                      </span>
                      {hasVoted && (
                        <span
                          className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center"
                          aria-label="투표한 출품작"
                          title="투표함"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              {selected && (
                <Card className="p-5 flex flex-col gap-4">
                  {/* 프롬프트 본문 — 상단 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-text-primary">프롬프트 본문</span>
                      <span className="text-xs text-text-faint">
                        출품 #{selected.id.replace(/-/g, '').slice(0, 3)}
                      </span>
                    </div>
                    {promptsUnlocked && selected.prompt_text ? (
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
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <p className="text-sm text-text-muted">
                          3표를 모두 행사하면 공개돼요 ({votesUsed}/{MAX_VOTES})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 결과물 전문 */}
                  <div>
                    <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
                      ✦ GEMINI 결과물
                    </div>
                    <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
                      {selected.result_text}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={
                      myVotes.some(v => v.submissionId === selected.id)
                      || votesUsed >= MAX_VOTES
                      || voting
                    }
                    onClick={() => handleVote(selected.id)}
                  >
                    {myVotes.some(v => v.submissionId === selected.id) ? '✓ 투표됨' : '✓ 이 답변에 투표'}
                  </Button>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
