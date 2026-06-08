'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import SubmissionCard from '@/components/SubmissionCard'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ds/button'
import { Textarea } from '@/ds/input'
import { Card, CardContent } from '@/ds/card'
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
}

const MAX_ATTEMPTS = 5

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
  }, [id, router])

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
      <div className="min-h-screen bg-bg-base">
        <Header />
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const attemptsLeft = MAX_ATTEMPTS - generations.length

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
          <Badge variant="success" className="mb-2.5">제출 기간</Badge>
          <h1 className="text-xl font-bold text-text-primary mb-2">{challenge?.title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{challenge?.instruction}</p>
        </Card>

        {/* Already submitted */}
        {submittedGenId && (
          <div
            role="status"
            className="px-4 py-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg mb-6 text-success text-sm font-medium"
          >
            제출 완료! 이미 이 챌린지에 프롬프트를 제출했어요.
          </div>
        )}

        {/* Generate form */}
        {!submittedGenId && (
          <Card className="p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-text-primary">프롬프트 작성</h2>
              <span className={['text-[13px] font-medium', attemptsLeft > 0 ? 'text-text-secondary' : 'text-error'].join(' ')}>
                남은 시도: {attemptsLeft} / {MAX_ATTEMPTS}
              </span>
            </div>

            <Textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder={`챌린지 주제에 맞는 프롬프트를 작성해주세요.\n\nAI에게 어떤 방식으로 요청해야 최고의 결과를 얻을 수 있을지 생각해보세요.`}
              disabled={loading || generations.length >= MAX_ATTEMPTS}
              rows={6}
              aria-label="프롬프트 입력"
            />

            {error && (
              <p role="alert" className="mt-2.5 text-sm text-error">{error}</p>
            )}

            <div className="flex justify-end mt-3">
              <Button
                variant="accent"
                onClick={handleGenerate}
                disabled={loading || !promptText.trim() || generations.length >= MAX_ATTEMPTS}
                className="text-[15px] px-6 py-2.5"
              >
                {loading ? '생성 중...' : '실행하기'}
              </Button>
            </div>
          </Card>
        )}

        {/* Confirm modal */}
        {showConfirm && selectedGenId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-6"
          >
            <Card className="p-7 max-w-[400px] w-full">
              <h3 id="confirm-title" className="text-lg font-bold mb-3">정말 제출할까요?</h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                제출 후에는 수정할 수 없어요. 선택한 결과물로 챌린지에 참여하게 됩니다. (+5 🪙)
              </p>
              <div className="flex gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Generations list */}
        {generations.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-text-primary mb-4">내 시도 목록</h2>
            <div className="flex flex-col gap-4">
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
