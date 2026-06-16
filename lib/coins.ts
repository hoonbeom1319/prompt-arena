import { SupabaseClient } from '@supabase/supabase-js'

export const COIN_AMOUNTS = {
  SUBMIT_PROMPT: 5,
  CAST_VOTE: 1,
  RANK_1: 100,
  RANK_2: 50,
  RANK_3: 25,
  // 데일리 퀴즈 (PRD v1.3 4.7.3) — 매일 정답 시 소액.
  QUIZ_CORRECT_DAILY: 1,
  // 연승 마일스톤 코인 보너스는 v1.3 초기엔 미지급(뱃지만 부여). 켤 때 여기에 상수를 추가하되
  // 두 부등호를 사수할 것: ① 마일스톤 보너스에 상한(예: 30연승까지)  ② 퀴즈 누적 보상 < 챌린지 우승 보상.
  // ("n승=n개"는 지수 폭발·부익부·본질 추월로 거부.) — lib/quiz.ts의 마일스톤 분기 참고.
} as const

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
