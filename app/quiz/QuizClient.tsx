'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/ds/card'
import RecoverModal from './RecoverModal'
import { useQuizGame, type MyAnswer, type StreakInfo, type RecoverState } from './useQuizGame'

interface QuizClientProps {
  isLoggedIn: boolean
  initialQuestion: { id: string; question: string } | null
  initialAnswered: boolean
  initialMyAnswer: MyAnswer | null
  initialStreak: StreakInfo | null
  initialRecover: RecoverState | null
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
  initialRecover,
}: QuizClientProps) {
  const router = useRouter()
  const game = useQuizGame({
    answered: initialAnswered,
    myAnswer: initialMyAnswer,
    streak: initialStreak,
    recover: initialRecover,
  })

  const handleAnswer = (choice: 'O' | 'X') => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
    game.answer(choice)
  }

  // 오늘 출제된 문항이 없는 날 (비축 소진 등) — 연승은 깨지지 않음
  if (!initialQuestion) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🌙</div>
        <p className="text-base text-text-muted">오늘은 퀴즈가 없어요.</p>
        <p className="text-sm text-text-muted mt-1">내일 다시 만나요!</p>
        {game.streak && game.streak.current > 0 && (
          <p className="text-sm text-text-secondary mt-4">현재 {game.streak.current}연승 유지 중 🔥</p>
        )}
      </Card>
    )
  }

  return (
    <div>
      {isLoggedIn && game.streak && <StreakBadge {...game.streak} />}

      <Card className="p-6 mb-5">
        <p className="text-xs font-semibold text-accent mb-3">오늘의 O/X 퀴즈</p>
        <p className="text-lg font-semibold text-text-primary leading-relaxed">
          {initialQuestion.question}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {(['O', 'X'] as const).map(opt => {
          const isMyChoice = game.myAnswer?.choice === opt
          const isAnswer = game.myAnswer?.correct_answer === opt
          // 채점 후 색: 정답=초록, 내가 고른 오답=빨강, 나머지=중립
          const stateClass = !game.answered
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
              disabled={game.answered || game.loading}
              className={`flex items-center justify-center h-28 rounded-lg border-2 text-5xl font-bold transition-colors disabled:cursor-default ${stateClass}`}
              aria-label={opt === 'O' ? '맞다 (O)' : '아니다 (X)'}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {game.error && <p className="text-sm text-red-500 text-center mt-4">{game.error}</p>}

      {game.answered && game.myAnswer && (
        <Card className="p-5 mt-5">
          <p className="text-base font-bold mb-2">
            {game.myAnswer.is_correct ? (
              <span className="text-green-600">정답이에요! 🎉</span>
            ) : (
              <span className="text-red-500">아쉬워요, 정답은 {game.myAnswer.correct_answer} 예요.</span>
            )}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{game.myAnswer.explanation}</p>
          {game.streak && (
            <p className="text-sm text-text-muted mt-4">
              {game.myAnswer.is_correct
                ? `🔥 ${game.streak.current}연승! 내일도 만나요.`
                : game.recovered
                ? `🛡️ 코인으로 ${game.streak.current}연승을 지켰어요. 내일 맞히면 이어져요!`
                : '연승이 초기화됐어요. 내일 다시 시작해요!'}
            </p>
          )}
          {/* 틀렸지만 회복 안 한 상태에서, 같은 날 다시 회복 팝업을 열 수 있는 진입점 */}
          {!game.myAnswer.is_correct && !game.recovered && game.recover?.recoverable && !game.showRecover && (
            <button
              type="button"
              onClick={game.openRecover}
              className="text-sm font-semibold text-accent mt-3 underline underline-offset-2"
            >
              코인 {game.recover.recoverCost}개로 연승 지키기
            </button>
          )}
        </Card>
      )}

      {game.showRecover && game.recover && (
        <RecoverModal
          recoverableStreak={game.recover.recoverableStreak}
          recoverCost={game.recover.recoverCost}
          balance={game.recover.balance}
          loading={game.recoverLoading}
          error={game.recoverError}
          onRecover={game.recoverStreak}
          onDismiss={game.dismissRecover}
        />
      )}

      {!isLoggedIn && (
        <p className="text-xs text-text-muted text-center mt-5">
          로그인하면 연승과 코인이 기록돼요.
        </p>
      )}
    </div>
  )
}
