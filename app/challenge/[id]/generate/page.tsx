'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import SubmissionCard from '@/components/SubmissionCard'
import { createClient } from '@/lib/supabase/client'

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
}

const MAX_ATTEMPTS = 5

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

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
      setChallenge(ch)
      if (gens) setGenerations(gens)
      if (submission) setSubmittedGenId(submission.generation_id)
      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]) // supabase is a stable browser singleton

  const handleGenerate = async () => {
    if (!promptText.trim()) return
    if (generations.length >= MAX_ATTEMPTS) {
      setError('최대 5번까지만 시도할 수 있어요.')
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
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const attemptsLeft = MAX_ATTEMPTS - generations.length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        {/* Back */}
        <Link href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
          ← 홈으로
        </Link>

        {/* Challenge info */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div className="badge badge-success" style={{ marginBottom: '10px', fontSize: '12px' }}>
            제출 기간
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {challenge?.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {challenge?.instruction}
          </p>
        </div>

        {/* Already submitted */}
        {submittedGenId && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            color: 'var(--success)',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            제출 완료! 이미 이 챌린지에 프롬프트를 제출했어요.
          </div>
        )}

        {/* Generate form */}
        {!submittedGenId && (
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                프롬프트 작성
              </h2>
              <span style={{
                fontSize: '13px',
                color: attemptsLeft > 0 ? 'var(--text-secondary)' : 'var(--error)',
                fontWeight: '500',
              }}>
                남은 시도: {attemptsLeft} / {MAX_ATTEMPTS}
              </span>
            </div>

            <textarea
              className="input"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder={`챌린지 주제에 맞는 프롬프트를 작성해주세요.\n\nAI에게 어떤 방식으로 요청해야 최고의 결과를 얻을 수 있을지 생각해보세요.`}
              disabled={loading || generations.length >= MAX_ATTEMPTS}
              rows={6}
            />

            {error && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={handleGenerate}
                disabled={loading || !promptText.trim() || generations.length >= MAX_ATTEMPTS}
                className="btn-accent"
                style={{ fontSize: '15px', padding: '10px 24px' }}
              >
                {loading ? '생성 중...' : '실행하기'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm modal */}
        {showConfirm && selectedGenId && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}>
            <div className="card" style={{ padding: '28px', maxWidth: '400px', width: '100%' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                정말 제출할까요?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                제출 후에는 수정할 수 없어요. 선택한 결과물로 챌린지에 참여하게 됩니다. (+5 🪙)
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-accent"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generations list */}
        {generations.length > 0 && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              내 시도 목록
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {generations.map(gen => (
                <SubmissionCard
                  key={gen.id}
                  attemptNumber={gen.attempt_number}
                  promptText={gen.prompt_text}
                  resultText={gen.result_text}
                  isSubmitted={gen.id === submittedGenId}
                  isSelected={gen.id === selectedGenId}
                  onSelect={
                    !submittedGenId
                      ? () => {
                          if (selectedGenId === gen.id) {
                            setSelectedGenId(null)
                          } else {
                            setSelectedGenId(gen.id)
                            setShowConfirm(true)
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
