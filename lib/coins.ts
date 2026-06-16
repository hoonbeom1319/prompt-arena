import { SupabaseClient } from '@supabase/supabase-js'

export const COIN_AMOUNTS = {
  SUBMIT_PROMPT: 5,
  CAST_VOTE: 1,
  RANK_1: 100,
  RANK_2: 50,
  RANK_3: 25,
  // 데일리 퀴즈 (PRD v1.3 4.7.3) — 매일 정답 시 소액. 연승 마일스톤 보너스/뱃지는 제외(연승 숫자 자체가 보상).
  // 나중에 마일스톤 코인을 켤 경우 두 부등호 사수: ① 보너스 상한  ② 퀴즈 누적 보상 < 챌린지 우승 보상.
  QUIZ_CORRECT_DAILY: 1,
} as const

// 코인 거래 사유(reason) 단일 출처 — DB `coin_transactions.reason`에 그대로 기록된다.
// 호출부의 한글 리터럴 산재를 막고, A-9(코인 경제 모니터링)가 reason별로 집계할 수 있게 한다.
// PRD 6.1 라벨 체계(적립/사용·출처)와 정렬. ⚠️ 값 문자열은 과거 기록과 일치해야 하므로 바꾸지 말 것.
export const COIN_REASONS = {
  SUBMIT_PROMPT: '프롬프트 제출',
  CAST_VOTE: '투표 참여',
  QUIZ_CORRECT: '퀴즈 정답',
  STREAK_RECOVERY: '연승 회복', // 첫 음수(사용) 거래
  RANK_1: '1등 보상',
  RANK_2: '2등 보상',
  RANK_3: '3등 보상',
} as const

export type CoinReason = (typeof COIN_REASONS)[keyof typeof COIN_REASONS]

// 순위 보상 reason — finalize가 등수로 조회한다 (1·2·3위 외엔 보상 없음).
export const RANK_REASONS: Record<number, CoinReason> = {
  1: COIN_REASONS.RANK_1,
  2: COIN_REASONS.RANK_2,
  3: COIN_REASONS.RANK_3,
}

// 연승 회복 비용 계수 N (PRD v1.4 4.7.6 — 코인 첫 사용처).
// 회복 비용 = 끊긴 직전 연승 길이 × N. 시작값 1.
// 주의: N=1이면 길게 쌓은 사람은 벌어둔 코인으로 거의 공짜 회복 → 회복 사용률이 과하면 상향.
export const STREAK_RECOVERY_COST_FACTOR = 1

export const recoveryCost = (streakLength: number) =>
  streakLength * STREAK_RECOVERY_COST_FACTOR

export const awardCoins = async (
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: CoinReason,
  challengeId?: string
) => {
  // Insert transaction
  const { error: txError } = await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount,
    reason,
    challenge_id: challengeId ?? null,
  })

  if (txError) {
    console.error('Failed to insert coin transaction:', txError)
    throw txError
  }

  // Update user balance
  const { error: updateError } = await supabase.rpc('increment_coins', {
    user_id_input: userId,
    amount_input: amount,
  })

  if (updateError) {
    // Fallback: manual update
    const { data: user } = await supabase
      .from('users')
      .select('coin_balance')
      .eq('id', userId)
      .single()

    if (user) {
      await supabase
        .from('users')
        .update({ coin_balance: user.coin_balance + amount })
        .eq('id', userId)
    }
  }
}

export const checkAndAwardBadge = async (
  supabase: SupabaseClient,
  userId: string,
  conditionType: string
) => {
  // Find badge
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('condition_type', conditionType)
    .single()

  if (!badge) return

  // Check if already earned
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .single()

  if (existing) return

  // Award badge
  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badge.id,
  })
}
