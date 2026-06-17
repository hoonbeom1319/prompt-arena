// 응답 채점 + 연승 갱신 + 보상 (PRD v1.3 4.7). 정답·해설은 응답 전 노출 금지 → service-role 클라이언트로만 호출.

import { SupabaseClient } from '@supabase/supabase-js'
import { awardCoins, COIN_AMOUNTS, COIN_REASONS, recoveryCost } from '@/lib/coin'
import { nextStreakValue } from './streak'
import { getCoinBalance, getStreak, type QuizItem, type StreakInfo } from './data'

export interface SubmitResult {
  is_correct: boolean
  correct_answer: 'O' | 'X'
  explanation: string
  streak: StreakInfo
  coinsAwarded: number
  // 연승 회복 제안 (PRD v1.4 4.7.6). 틀려서 끊긴 경우에만 true.
  recoverable: boolean
  recoverableStreak: number // 끊긴 직전 연승 길이 (회복 시 복원될 값)
  recoverCost: number       // 회복 비용 = recoverableStreak × N
  balance: number           // 현재 코인 잔액 (회복 가능 여부 판단용)
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
    // 이미 응답했다면(23505) 보상 없이 현재 상태만 반환 (회복 재제안도 안 함)
    const [streak, balance] = await Promise.all([
      getStreak(service, userId),
      getCoinBalance(service, userId),
    ])
    return {
      is_correct: isCorrect,
      correct_answer: item.correct_answer,
      explanation: item.explanation,
      streak,
      coinsAwarded: 0,
      recoverable: false,
      recoverableStreak: 0,
      recoverCost: 0,
      balance,
    }
  }

  const prev = await getStreak(service, userId)
  let newCurrent = 0
  let coinsAwarded = 0
  let recoverableStreak = 0

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
        // 정답이면 회복 대상 없음 — 혹시 남아 있던 회복 컨텍스트도 비운다.
        recoverable_streak: null,
        recoverable_date: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    // 매일 정답 소액 보상 (마일스톤 뱃지·보너스는 사용자 결정으로 제외 — 연승 숫자 자체가 보상)
    await awardCoins(service, userId, COIN_AMOUNTS.QUIZ_CORRECT_DAILY, COIN_REASONS.QUIZ_CORRECT)
    coinsAwarded = COIN_AMOUNTS.QUIZ_CORRECT_DAILY
  } else {
    // 틀리면 0으로 초기화. last_correct_date는 그대로 둬서 다음 정답일에 연속이 끊긴 것으로 판정.
    // 단, 끊긴 직전 연승(prev.current > 0)은 "틀린 직후 그 자리"에서만 코인으로 회복 가능(PRD 4.7.6).
    // → 회복 컨텍스트를 streaks에 저장. 소급 방지는 recoverable_date == 오늘 게시일 검증으로(회복 API).
    newCurrent = 0
    recoverableStreak = prev.current
    await service.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: 0,
        best_streak: prev.best,
        recoverable_streak: recoverableStreak > 0 ? recoverableStreak : null,
        recoverable_date: recoverableStreak > 0 ? item.publish_date : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  const balance = await getCoinBalance(service, userId)

  return {
    is_correct: isCorrect,
    correct_answer: item.correct_answer,
    explanation: item.explanation,
    streak: { current: newCurrent, best: Math.max(prev.best, newCurrent) },
    coinsAwarded,
    recoverable: recoverableStreak > 0,
    recoverableStreak,
    recoverCost: recoveryCost(recoverableStreak),
    balance,
  }
}
