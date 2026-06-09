'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import VoteCard from '@/components/VoteCard'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

interface Submission {
  id: string
  result_text: string
  prompt_text?: string
}

interface VoteState {
  submissionId: string
}

interface Challenge {
  id: string
  title: string
  instruction: string
}

const MAX_VOTES = 3

export default function VotePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = useMemo(() => createClient(), [])

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [myVotes, setMyVotes] = useState<VoteState[]>([])
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [promptMap, setPromptMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/auth/login'); return }

      const { data: ch } = await supabase
        .from('challenges')
        .select('id, title, instruction')
        .eq('id', id)
        .single()

      if (cancelled) return
      if (!ch) { router.push('/'); return }

      // RLS로 남의 결과물을 못 읽으므로 서버 API(service client)에서 블라인드 목록을 받는다.
      const res = await fetch(`/api/vote?challengeId=${id}`)
      const data = await res.json()

      if (cancelled) return

      setChallenge(ch)

      if (res.ok) {
        setSubmissions(data.submissions.map((s: { id: string; result_text: string }) => ({
          id: s.id,
          result_text: s.result_text,
        })))
        const pm: Record<string, string> = {}
        data.submissions.forEach((s: { id: string; prompt_text: string | null }) => {
          if (s.prompt_text != null) pm[s.id] = s.prompt_text
        })
        setPromptMap(pm)
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
        // 3표를 다 쓰면 프롬프트가 공개되므로 목록을 다시 받아 promptMap을 채운다.
        const listRes = await fetch(`/api/vote?challengeId=${id}`)
        const listData = await listRes.json()
        if (listRes.ok) {
          const pm: Record<string, string> = {}
          listData.submissions.forEach((s: { id: string; prompt_text: string | null }) => {
            if (s.prompt_text != null) pm[s.id] = s.prompt_text
          })
          setPromptMap(pm)
        }
      }
    }

    setVoting(false)
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <Header />
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Header />

      <main className="container pt-8 pb-16">
        <Link
          href="/"
          className="text-sm text-text-secondary no-underline inline-flex items-center gap-1 mb-5 hover:text-text-primary transition-colors"
        >
          ← 홈으로
        </Link>

        {/* Challenge info */}
        <Card className="p-5 mb-6">
          <Badge variant="warning" className="mb-2.5">투표 중</Badge>
          <h1 className="text-xl font-bold text-text-primary mb-2">{challenge?.title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{challenge?.instruction}</p>
        </Card>

        {/* Vote counter */}
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">투표 현황</p>
              <p className="text-[13px] text-text-secondary">
                {myVotes.length >= MAX_VOTES
                  ? '모든 투표를 완료했어요! 프롬프트가 공개됩니다.'
                  : `최대 ${MAX_VOTES}개까지 투표할 수 있어요`}
              </p>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="투표 현황">
              {Array.from({ length: MAX_VOTES }).map((_, i) => (
                <div
                  key={i}
                  aria-label={i < myVotes.length ? '투표 완료' : '투표 대기'}
                  className={[
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold',
                    i < myVotes.length
                      ? 'bg-accent border-accent'
                      : 'bg-border border-border-strong',
                  ].join(' ')}
                >
                  {i < myVotes.length ? '✓' : ''}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {revealed && (
          <div
            role="status"
            className="px-4 py-3 bg-accent-light border border-accent/30 rounded-lg text-accent text-sm font-medium mb-5"
          >
            3표를 모두 사용했어요! 이제 각 AI 응답에 사용된 프롬프트가 공개됩니다.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Submissions */}
        {submissions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-base text-text-muted">아직 제출된 프롬프트가 없어요.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map(sub => (
              <VoteCard
                key={sub.id}
                submissionId={sub.id}
                resultText={sub.result_text}
                promptText={promptMap[sub.id]}
                hasVoted={myVotes.some(v => v.submissionId === sub.id)}
                isRevealed={revealed}
                onVote={handleVote}
                voting={voting}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
