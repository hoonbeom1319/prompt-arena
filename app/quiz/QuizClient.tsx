'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/ds/card'

interface MyAnswer {
  choice: 'O' | 'X'
  is_correct: boolean
  correct_answer: 'O' | 'X'
  explanation: string
}

interface StreakInfo {
  current: number
  best: number
}

interface QuizClientProps {
  isLoggedIn: boolean
  initialQuestion: { id: string; question: string } | null
  initialAnswered: boolean
  initialMyAnswer: MyAnswer | null
  initialStreak: StreakInfo | null
}

const StreakBadge = ({ current, best }: StreakInfo) => (
  <div className="flex items-center justify-center gap-2 mb-5">
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card border border-border px-3.5 py-1.5">
      <span aria-hidden="true">🔥</span>
      <span className="text-sm font-bold text-text-primary">{current}연승</span>
    </span>
    <span className="text-xs text-text-muted">최고 {best}연승</span>
  </div>
)

export default function QuizClient({
  isLoggedIn,
  initialQuestion,
  initialAnswered,
  initialMyAnswer,
  initialStreak,
}: QuizClientProps) {
  const router = useRouter()
  const [answered, setAnswered] = useState(initialAnswered)
  const [myAnswer, setMyAnswer] = useState<MyAnswer | null>(initialMyAnswer)
  const [streak, setStreak] = useState<StreakInfo | null>(initialStreak)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 오늘 출제된 문항이 없는 날 (비축 소진 등) — 연승은 깨지지 않음
  if (!initialQuestion) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🌙</div>
        <p className="text-base text-text-muted">오늘은 퀴즈가 없어요.</p>
        <p className="text-sm text-text-muted mt-1">내일 다시 만나요!</p>
        {streak && streak.current > 0 && (
          <p className="text-sm text-text-secondary mt-4">현재 {streak.current}연승 유지 중 🔥</p>
        )}
      </Card>
    )
  }

  const handleAnswer = async (choice: 'O' | 'X') => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
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
    } catch {
      setError('네트워크 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {isLoggedIn && streak && <StreakBadge {...streak} />}

      <Card className="p-6 mb-5">
        <p className="text-xs font-semibold text-accent mb-3">오늘의 O/X 퀴즈</p>
        <p className="text-lg font-semibold text-text-primary leading-relaxed">
          {initialQuestion.question}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {(['O', 'X'] as const).map(opt => {
          const isMyChoice = myAnswer?.choice === opt
          const isAnswer = myAnswer?.correct_answer === opt
          // 채점 후 색: 정답=초록, 내가 고른 오답=빨강, 나머지=중립
          const stateClass = !answered
            ? 'border-border bg-bg-card text-text-primary hover:border-accent hover:bg-bg-subtle'
            : isAnswer
            ? 'border-green-500 bg-green-500/10 text-green-600'
            : isMyChoice
            ? 'border-red-500 bg-red-500/10 text-red-600'
            : 'border-border bg-bg-card text-text-muted opacity-60'
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleAnswer(opt)}
              disabled={answered || loading}
              className={`flex items-center justify-center h-28 rounded-lg border-2 text-5xl font-bold transition-colors disabled:cursor-default ${stateClass}`}
              aria-label={opt === 'O' ? '맞다 (O)' : '아니다 (X)'}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

      {answered && myAnswer && (
        <Card className="p-5 mt-5">
          <p className="text-base font-bold mb-2">
            {myAnswer.is_correct ? (
              <span className="text-green-600">정답이에요! 🎉</span>
            ) : (
              <span className="text-red-500">아쉬워요, 정답은 {myAnswer.correct_answer} 예요.</span>
            )}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{myAnswer.explanation}</p>
          {streak && (
            <p className="text-sm text-text-muted mt-4">
              {myAnswer.is_correct
                ? `🔥 ${streak.current}연승! 내일도 만나요.`
                : '연승이 초기화됐어요. 내일 다시 시작해요!'}
            </p>
          )}
        </Card>
      )}

      {!isLoggedIn && (
        <p className="text-xs text-text-muted text-center mt-5">
          로그인하면 연승과 코인이 기록돼요.
        </p>
      )}
    </div>
  )
}
