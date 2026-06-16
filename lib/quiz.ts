// 데일리 O/X 퀴즈 + 연승 핵심 로직 (PRD v1.3 4.7)
//
// 원칙:
//  - 하루 기준 = 서버 시각 자정~자정, KST 달력 기준 (challenge-schedule와 동일 기조).
//  - 연승은 "출제된 날만" 카운트 → 출제 공백(비축 소진)이 사용자 연승을 깨지 않는다 (4.7.5).
//  - 하루라도 빠지거나(직전 출제일에 정답이 없으면) 틀리면 연승 0 (4.7.2).
//  - 정답·해설은 응답 전 클라이언트에 노출 금지 → 이 모듈은 service-role 클라이언트로만 호출한다.

import { SupabaseClient } from '@supabase/supabase-js'
import { awardCoins, COIN_AMOUNTS } from './coins'

// 정답을 맞혔을 때의 새 연승 값 (순수 함수 — 테스트 대상).
//  - prevPublishDate: 오늘 이전 '출제된' 가장 최근 날짜 (출제 공백은 건너뛴 값).
//  - lastCorrectDate: 사용자가 마지막으로 정답을 맞힌 게시일.
// 직전 출제일에 내가 정답이었으면(둘이 같으면) 연속 +1, 아니면 1로 새 시작.
// → 하루라도 빠지거나(직전 출제일에 응답 없음/오답) 끊기면 1. 출제 공백은 깨지 않음.
export const nextStreakValue = (
  prevCurrent: number,
  lastCorrectDate: string | null,
  prevPublishDate: string | null
): number => {
  const continued = !!prevPublishDate && lastCorrectDate === prevPublishDate
  return continued ? prevCurrent + 1 : 1
}

export interface QuizItem {
  id: string
  question: string
  correct_answer: 'O' | 'X'
  explanation: string
  publish_date: string
}

export interface StreakInfo {
  current: number
  best: number
}

// 현재 시각을 KST 달력의 'YYYY-MM-DD'로. (서버 런타임 타임존 무관하게 +9h 고정)
export const kstToday = (): string => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// 오늘(KST) 게시된 문항. 없으면 null (그날 퀴즈 없음 — 연승에 영향 없음).
export const getTodayQuizItem = async (
  service: SupabaseClient
): Promise<QuizItem | null> => {
  const { data } = await service
    .from('quiz_items')
    .select('id, question, correct_answer, explanation, publish_date')
    .eq('publish_date', kstToday())
    .maybeSingle()
  return (data as QuizItem) ?? null
}

// 사용자의 현재 연승 정보 (행이 없으면 0/0).
export const getStreak = async (
  service: SupabaseClient,
  userId: string
): Promise<StreakInfo> => {
  const { data } = await service
    .from('streaks')
    .select('current_streak, best_streak')
    .eq('user_id', userId)
    .maybeSingle()
  return { current: data?.current_streak ?? 0, best: data?.best_streak ?? 0 }
}

// 오늘 문항에 대한 사용자의 응답(있으면). 정답/해설은 응답한 뒤에만 노출되므로 함께 반환.
export const getMyAnswerForItem = async (
  service: SupabaseClient,
  userId: string,
  itemId: string
) => {
  const { data } = await service
    .from('quiz_answers')
    .select('choice, is_correct')
    .eq('user_id', userId)
    .eq('quiz_item_id', itemId)
    .maybeSingle()
  return data as { choice: 'O' | 'X'; is_correct: boolean } | null
}

export interface SubmitResult {
  is_correct: boolean
  correct_answer: 'O' | 'X'
  explanation: string
  streak: StreakInfo
  coinsAwarded: number
}

// 응답 채점 + 연승 갱신 + 보상. 하루 1회 가드는 호출처(라우트)에서 unique 위반으로도 막히지만,
// 여기서도 기존 응답이 있으면 채점만 돌려준다(중복 보상 방지).
export const submitQuizAnswer = async (
  service: SupabaseClient,
  userId: string,
  item: QuizItem,
  choice: 'O' | 'X'
): Promise<SubmitResult> => {
  const isCorrect = choice === item.correct_answer

  // 응답 기록 (unique(user_id, quiz_item_id)로 하루 1회 보장)
  const { error: insertError } = await service.from('quiz_answers').insert({
    user_id: userId,
    quiz_item_id: item.id,
    choice,
    is_correct: isCorrect,
  })
  if (insertError) {
    // 이미 응답했다면(23505) 보상 없이 현재 상태만 반환
    const streak = await getStreak(service, userId)
    return {
      is_correct: isCorrect,
      correct_answer: item.correct_answer,
      explanation: item.explanation,
      streak,
      coinsAwarded: 0,
    }
  }

  const prev = await getStreak(service, userId)
  let newCurrent = 0
  let coinsAwarded = 0

  if (isCorrect) {
    // 직전 '출제일'(오늘 이전 가장 최근 publish_date)을 찾는다 — 출제 공백은 건너뛴다.
    const { data: prevItem } = await service
      .from('quiz_items')
      .select('publish_date')
      .lt('publish_date', item.publish_date)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: streakRow } = await service
      .from('streaks')
      .select('last_correct_date')
      .eq('user_id', userId)
      .maybeSingle()

    newCurrent = nextStreakValue(
      prev.current,
      streakRow?.last_correct_date ?? null,
      prevItem?.publish_date ?? null
    )

    const newBest = Math.max(prev.best, newCurrent)
    await service.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: newCurrent,
        best_streak: newBest,
        last_correct_date: item.publish_date,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    // 매일 정답 소액 보상 (마일스톤 뱃지·보너스는 사용자 결정으로 제외 — 연승 숫자 자체가 보상)
    await awardCoins(service, userId, COIN_AMOUNTS.QUIZ_CORRECT_DAILY, '퀴즈 정답')
    coinsAwarded = COIN_AMOUNTS.QUIZ_CORRECT_DAILY
  } else {
    // 틀리면 초기화. last_correct_date는 그대로 둬서 다음 정답일에 연속이 끊긴 것으로 판정.
    newCurrent = 0
    await service.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: 0,
        best_streak: prev.best,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  return {
    is_correct: isCorrect,
    correct_answer: item.correct_answer,
    explanation: item.explanation,
    streak: { current: newCurrent, best: Math.max(prev.best, newCurrent) },
    coinsAwarded,
  }
}
