'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import VoteCard from '@/components/VoteCard'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

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

      const { data: subs } = await supabase
        .from('submissions')
        .select(`id, generations!inner(result_text, prompt_text)`)
        .eq('challenge_id', id)
        .eq('is_seed', false)

      const { data: votes } = await supabase
        .from('votes')
        .select('submission_id')
        .eq('challenge_id', id)
        .eq('user_id', user.id)

      if (cancelled) return

      setChallenge(ch)

      if (subs) {
        const mapped = subs.map((s: {
          id: string;
          generations: { result_text: string; prompt_text: string } | Array<{ result_text: string; prompt_text: string }>
        }) => {
          const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
          return { id: s.id, result_text: gen?.result_text ?? '', _prompt: gen?.prompt_text ?? '' }
        })
        setSubmissions(mapped.map(m => ({ id: m.id, result_text: m.result_text })))
        const pm: Record<string, string> = {}
        mapped.forEach(m => { pm[m.id] = m._prompt })
        setPromptMap(pm)
      }

      if (votes) {
        const voteStates = votes.map(v => ({ submissionId: v.submission_id }))
        setMyVotes(voteStates)
        if (voteStates.length >= MAX_VOTES) setRevealed(true)
      }

      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]) // supabase is a stable browser singleton

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
      }
    }

    setVoting(false)
  }

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <Link href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
          ← 홈으로
        </Link>

        {/* Challenge info */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div className="badge badge-warning" style={{ marginBottom: '10px', fontSize: '12px' }}>
            투표 중
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {challenge?.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {challenge?.instruction}
          </p>
        </div>

        {/* Vote counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '14px 18px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              투표 현황
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {myVotes.length >= MAX_VOTES
                ? '모든 투표를 완료했어요! 프롬프트가 공개됩니다.'
                : `최대 ${MAX_VOTES}개까지 투표할 수 있어요`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: MAX_VOTES }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: i < myVotes.length ? 'var(--accent)' : 'var(--border)',
                  border: `2px solid ${i < myVotes.length ? 'var(--accent)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                }}
              >
                {i < myVotes.length ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>

        {revealed && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--accent-light)',
            border: '1px solid rgba(217,119,87,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '20px',
          }}>
            3표를 모두 사용했어요! 이제 각 AI 응답에 사용된 프롬프트가 공개됩니다.
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Submissions */}
        {submissions.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>아직 제출된 프롬프트가 없어요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
