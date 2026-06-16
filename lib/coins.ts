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

// 연승 회복 비용 계수 N (PRD v1.4 4.7.6 — 코인 첫 사용처).
// 회복 비용 = 끊긴 직전 연승 길이 × N. 시작값 1.
// 주의: N=1이면 길게 쌓은 사람은 벌어둔 코인으로 거의 공짜 회복 → 회복 사용률이 과하면 상향.
export const STREAK_RECOVERY_COST_FACTOR = 1

export const recoveryCost = (streakLength: number) =>
  streakLength * STREAK_RECOVERY_COST_FACTOR

export async function awardCoins(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  challengeId?: string
) {
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

export async function checkAndAwardBadge(
  supabase: SupabaseClient,
  userId: string,
  conditionType: string
) {
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
