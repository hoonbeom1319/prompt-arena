import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTodayQuizItem, getStreak, getMyAnswerForItem } from '@/lib/quiz'
import AppBar from '@/components/AppBar'
import TabBar from '@/components/TabBar'
import QuizClient from './QuizClient'

export const dynamic = 'force-dynamic'

export default async function QuizPage() {
  const service = await createServiceClient()
  const item = await getTodayQuizItem(service)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let answered = false
  let myAnswer = null
  let streak = null

  if (user && item) {
    const [a, s] = await Promise.all([
      getMyAnswerForItem(service, user.id, item.id),
      getStreak(service, user.id),
    ])
    answered = !!a
    myAnswer = a
      ? {
          choice: a.choice,
          is_correct: a.is_correct,
          correct_answer: item.correct_answer,
          explanation: item.explanation,
        }
      : null
    streak = s
  } else if (user) {
    streak = await getStreak(service, user.id)
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="데일리 퀴즈" />
      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-6 pb-20 md:pb-10">
        <QuizClient
          isLoggedIn={!!user}
          initialQuestion={item ? { id: item.id, question: item.question } : null}
          initialAnswered={answered}
          initialMyAnswer={myAnswer}
          initialStreak={streak}
        />
      </main>
      <TabBar />
    </div>
  )
}
