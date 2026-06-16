'use client'

import { useState } from 'react'
import { MAX_GENERATIONS } from '@/lib/constants'

export interface Generation {
  id: string
  prompt_text: string
  result_text: string
  attempt_number: number
}

interface GenerationInitial {
  generations: Generation[]
  submittedGenId: string | null
}

// 생성·제출 상태 머신 + /api 호출을 캡슐화. 데이터 읽기는 서버 컴포넌트(page.tsx)가 담당.
// 쓰기는 /api/generate · /api/submit 경유 — supabase 직접 호출 없음 (ARCHITECTURE §2·§4).
export const useGeneration = (challengeId: string, initial: GenerationInitial) => {
  const [generations, setGenerations] = useState<Generation[]>(initial.generations)
  const [activeGenId, setActiveGenId] = useState<string | null>(initial.generations[0]?.id ?? null)
  const [submittedGenId, setSubmittedGenId] = useState<string | null>(initial.submittedGenId)
  const [promptText, setPromptText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
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
      body: JSON.stringify({ challengeId, promptText: promptText.trim() }),
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

  // 성공 여부를 돌려준다 — 확인 모달 닫기는 컴포넌트(UI)가 결정.
  const submit = async (generationId: string) => {
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, generationId }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || '제출에 실패했어요.')
      return false
    }
    setSubmittedGenId(generationId)
    return true
  }

  const locked = generations.length >= MAX_GENERATIONS
  const activeGen = generations.find(g => g.id === activeGenId) ?? generations[0]

  return {
    generations,
    activeGenId,
    setActiveGenId,
    submittedGenId,
    promptText,
    setPromptText,
    loading,
    submitting,
    error,
    locked,
    activeGen,
    generate,
    submit,
  }
}
