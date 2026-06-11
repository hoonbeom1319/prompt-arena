'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppBar from '@/components/AppBar'
import BlindCard from '@/components/BlindCard'
import VoteTokens from '@/components/VoteTokens'
import { createClient } from '@/lib/supabase/client'
import { MAX_VOTES } from '@/lib/constants'
import { Card } from '@/ds/card'

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

  const [_challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [myVotes, setMyVotes] = useState<VoteState[]>([])
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

      <main className="max-w-[430px] mx-auto px-4 pt-4 pb-8 flex flex-col gap-3.5">
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
          submissions.map(sub => (
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
          ))
        )}
      </main>
    </div>
  )
}
