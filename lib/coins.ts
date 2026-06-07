import { SupabaseClient } from '@supabase/supabase-js'

export const COIN_AMOUNTS = {
  SUBMIT_PROMPT: 5,
  CAST_VOTE: 1,
  RANK_1: 100,
  RANK_2: 50,
  RANK_3: 25,
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
