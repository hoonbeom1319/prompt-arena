'use client'

import { useState } from 'react'

export interface MyAnswer {
  choice: 'O' | 'X'
  is_correct: boolean
  correct_answer: 'O' | 'X'
  explanation: string
}

export interface StreakInfo {
  current: number
  best: number
}

export interface RecoverState {
  recoverable: boolean
  recoverableStreak: number
  recoverCost: number
  balance: number
}

interface QuizGameInitial {
  answered: boolean
  myAnswer: MyAnswer | null
  streak: StreakInfo | null
  recover: RecoverState | null
}

// O/X 퀴즈 한 판의 상태 머신 + /api 호출을 캡슐화. (ARCHITECTURE.md §4 — 컴포넌트 useState 뭉치 추출)
export const useQuizGame = (initial: QuizGameInitial) => {
  const [answered, setAnswered] = useState(initial.answered)
  const [myAnswer, setMyAnswer] = useState<MyAnswer | null>(initial.myAnswer)
  const [streak, setStreak] = useState<StreakInfo | null>(initial.streak)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 연승 회복 (PRD v1.4 4.7.6) — 틀린 직후 제안 팝업. 새로고침 후에도 회복 가능하면(initial.recover) 다시 띄움.
  const [recover, setRecover] = useState<RecoverState | null>(
    initial.recover?.recoverable ? initial.recover : null
  )
  const [showRecover, setShowRecover] = useState(!!initial.recover?.recoverable)
  const [recovered, setRecovered] = useState(false)
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverError, setRecoverError] = useState<string | null>(null)

  const answer = async (choice: 'O' | 'X') => {
    if (answered || loading) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '제출에 실패했어요.')
        return
      }
      setMyAnswer({
        choice,
        is_correct: data.is_correct,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
      })
      setStreak(data.streak)
      setAnswered(true)
      // 틀려서 끊긴 연승이 있으면 회복 제안 팝업 (그 자리에서만 결정 — PRD 4.7.6)
      if (data.recoverable) {
        setRecover({
          recoverable: true,
          recoverableStreak: data.recoverableStreak,
          recoverCost: data.recoverCost,
          balance: data.balance,
        })
        setShowRecover(true)
      }
    } catch {
      setError('네트워크 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  const recoverStreak = async () => {
    if (recoverLoading) return
    setRecoverLoading(true)
    setRecoverError(null)
    try {
      const res = await fetch('/api/quiz/recover', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        // 코인 부족 등 — 잔액 갱신 후 안내 유지
        if (typeof data.balance === 'number' && recover) {
          setRecover({ ...recover, balance: data.balance })
        }
        setRecoverError(data.error ?? '회복에 실패했어요.')
        return
      }
      setStreak(data.streak)
      setRecovered(true)
      setShowRecover(false)
    } catch {
      setRecoverError('네트워크 오류가 발생했어요.')
    } finally {
      setRecoverLoading(false)
    }
  }

  // 포기 = 연승 0 확정 (서버는 이미 0으로 기록됨, 소급 불가).
  const dismissRecover = () => {
    if (recoverLoading) return
    setShowRecover(false)
  }

  const openRecover = () => setShowRecover(true)

  return {
    answered,
    myAnswer,
    streak,
    loading,
    error,
    recover,
    showRecover,
    recovered,
    recoverLoading,
    recoverError,
    answer,
    recoverStreak,
    dismissRecover,
    openRecover,
  }
}
