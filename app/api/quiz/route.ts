import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  getTodayQuizItem,
  getStreak,
  getMyAnswerForItem,
  getRecoverState,
  submitQuizAnswer,
} from '@/lib/quiz'

// 오늘의 퀴즈 상태 조회.
// 정답·해설은 *이미 응답한 경우에만* 내려준다 (응답 전 정답 노출 금지).
export async function GET() {
  try {
    const service = await createServiceClient()
    const item = await getTodayQuizItem(service)

    if (!item) {
      // 오늘 출제된 문항 없음 (비축 소진 등) — 연승엔 영향 없음
      return NextResponse.json({ item: null })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 비회원: 문항만, 연승·응답 없음
    if (!user) {
      return NextResponse.json({
        item: { id: item.id, question: item.question },
        answered: false,
        streak: null,
      })
    }

    const [myAnswer, streak, recover] = await Promise.all([
      getMyAnswerForItem(service, user.id, item.id),
      getStreak(service, user.id),
      getRecoverState(service, user.id, item),
    ])

    return NextResponse.json({
      item: { id: item.id, question: item.question },
      answered: !!myAnswer,
      myAnswer: myAnswer
        ? {
            choice: myAnswer.choice,
            is_correct: myAnswer.is_correct,
            correct_answer: item.correct_answer,
            explanation: item.explanation,
          }
        : null,
      streak,
      recover,
    })
  } catch (err) {
    console.error('Quiz GET error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}

// 오늘의 퀴즈 응답 제출 → 채점 + 연승 갱신 + 보상.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { choice } = await request.json()
    if (choice !== 'O' && choice !== 'X') {
      return NextResponse.json({ error: 'O 또는 X를 선택해 주세요.' }, { status: 400 })
    }

    const service = await createServiceClient()

    // 서버가 '오늘 문항'을 직접 정한다 (클라이언트가 보낸 문항 ID를 신뢰하지 않음).
    const item = await getTodayQuizItem(service)
    if (!item) {
      return NextResponse.json({ error: '오늘은 퀴즈가 없어요.' }, { status: 404 })
    }

    // 하루 1회 — 이미 응답했으면 차단
    const existing = await getMyAnswerForItem(service, user.id, item.id)
    if (existing) {
      return NextResponse.json({ error: '오늘은 이미 풀었어요.' }, { status: 409 })
    }

    const result = await submitQuizAnswer(service, user.id, item, choice)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Quiz POST error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
