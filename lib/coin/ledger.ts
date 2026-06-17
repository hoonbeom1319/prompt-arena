// 코인 원장 — 적립/차감 거래 기록 + 잔액 갱신, 뱃지 수여. 상수·reason은 ./amounts, 회복 비용은 ./recovery.
import { SupabaseClient } from '@supabase/supabase-js'
import type { CoinReason } from './amounts'

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
