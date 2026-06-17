// 데일리 O/X 퀴즈 + 연승 핵심 로직 (PRD v1.3 4.7)
//
// 원칙:
//  - 하루 기준 = 서버 시각 자정~자정, KST 달력 기준 (challenge-schedule와 동일 기조).
//  - 연승은 "출제된 날만" 카운트 → 출제 공백(비축 소진)이 사용자 연승을 깨지 않는다 (4.7.5).
//  - 하루라도 빠지거나(직전 출제일에 정답이 없으면) 틀리면 연승 0 (4.7.2).
//  - 정답·해설은 응답 전 클라이언트에 노출 금지 → 이 모듈은 service-role 클라이언트로만 호출한다.

import { SupabaseClient } from '@supabase/supabase-js'
import { awardCoins, COIN_AMOUNTS, COIN_REASONS, recoveryCost } from '@/lib/coin'
import { kstToday } from './time'

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

// 사용자의 코인 잔액 (회복 비용 충당 가능 여부 판단용).
export const getCoinBalance = async (
  service: SupabaseClient,
  userId: string
): Promise<number> => {
  const { data } = await service
    .from('users')
    .select('coin_balance')
    .eq('id', userId)
    .maybeSingle()
  return data?.coin_balance ?? 0
}

export interface RecoverState {
  recoverable: boolean
  recoverableStreak: number
  recoverCost: number
  balance: number
}

// 오늘 회복 가능한 끊긴 연승이 있는지 (페이지 새로고침 후에도 회복 팝업을 일관되게 다시 띄우기 위함).
// 서버 기준: streaks.recoverable_date == 오늘 게시일이고 recoverable_streak>0일 때만 회복 가능.
export const getRecoverState = async (
  service: SupabaseClient,
  userId: string,
  item: QuizItem
): Promise<RecoverState> => {
  const [{ data: row }, balance] = await Promise.all([
    service
      .from('streaks')
      .select('recoverable_streak, recoverable_date')
      .eq('user_id', userId)
      .maybeSingle(),
    getCoinBalance(service, userId),
  ])
  const recoverableStreak = row?.recoverable_streak ?? 0
  const recoverable =
    recoverableStreak > 0 && row?.recoverable_date === item.publish_date
  return {
    recoverable,
    recoverableStreak: recoverable ? recoverableStreak : 0,
    recoverCost: recoverable ? recoveryCost(recoverableStreak) : 0,
    balance,
  }
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

export interface RecoverResult {
  ok: boolean
  error?: string
  streak: StreakInfo
  coinsSpent: number
  balance: number
}

// 연승 회복 실행 (PRD v1.4 4.7.6) — 코인 첫 사용처.
//  - "틀린 직후 그 자리"에서만(소급 불가): recoverable_date == 오늘 게시일일 때만 허용.
//  - 비용 = 끊긴 직전 연승 × N. 코인 부족 시 회복 불가.
//  - 효과는 "유지만": current_streak을 끊긴 값으로 복원(+1 없음).
//    단 last_correct_date는 오늘로 갱신 → 다음 정답일에 연속이 이어진다(거기서 +1).
export const recoverStreak = async (
  service: SupabaseClient,
  userId: string
): Promise<RecoverResult> => {
  const fail = async (error: string): Promise<RecoverResult> => {
    const [streak, balance] = await Promise.all([
      getStreak(service, userId),
      getCoinBalance(service, userId),
    ])
    return { ok: false, error, streak, coinsSpent: 0, balance }
  }

  // 서버가 '오늘 문항'을 직접 정한다 (클라이언트 입력 불신).
  const item = await getTodayQuizItem(service)
  if (!item) return fail('오늘은 퀴즈가 없어요.')

  const { data: row } = await service
    .from('streaks')
    .select('current_streak, best_streak, recoverable_streak, recoverable_date')
    .eq('user_id', userId)
    .maybeSingle()

  const recoverable = row?.recoverable_streak ?? 0
  // 회복 조건: 끊긴 직전 연승이 있고, 그 끊김이 '오늘'(틀린 직후)이어야 함. 소급 불가.
  if (!row || recoverable <= 0 || row.recoverable_date !== item.publish_date) {
    return fail('지금은 회복할 수 있는 연승이 없어요.')
  }

  const cost = recoveryCost(recoverable)
  const balance = await getCoinBalance(service, userId)
  if (balance < cost) {
    return fail(`코인이 부족해요. (회복 비용 ${cost}, 보유 ${balance})`)
  }

  // 코인 차감 (첫 음수 거래) → 연승 복원. 차감 후 잔액 음수 방지는 위 사전 체크로 보장.
  await awardCoins(service, userId, -cost, COIN_REASONS.STREAK_RECOVERY)

  const restored = recoverable
  await service.from('streaks').upsert(
    {
      user_id: userId,
      current_streak: restored,
      best_streak: Math.max(row.best_streak ?? 0, restored),
      // 오늘을 '메운 날'로 표시 → 다음 정답일에 연속이 이어짐. (값 자체는 +1 안 함 = 유지만.)
      last_correct_date: item.publish_date,
      // 재회복·소급 차단: 회복 컨텍스트 비움.
      recoverable_streak: null,
      recoverable_date: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return {
    ok: true,
    streak: { current: restored, best: Math.max(row.best_streak ?? 0, restored) },
    coinsSpent: cost,
    balance: balance - cost,
  }
}
