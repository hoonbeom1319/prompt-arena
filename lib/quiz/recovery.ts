// 연승 회복 — 제안 상태 조회 + 실행 (PRD v1.4 4.7.6, 코인 첫 사용처).
// 회복 *비용* 계산은 lib/coin/recovery.ts(recoveryCost), 여기는 streak 복원 흐름.

import { SupabaseClient } from '@supabase/supabase-js'
import { awardCoins, COIN_REASONS, recoveryCost } from '@/lib/coin'
import { getCoinBalance, getStreak, getTodayQuizItem, type QuizItem, type StreakInfo } from './data'

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
