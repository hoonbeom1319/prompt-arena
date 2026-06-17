// 퀴즈 데이터 조회 + 공유 타입. 정답·해설은 응답 전 노출 금지 → service-role 클라이언트로만 호출한다.

import { SupabaseClient } from '@supabase/supabase-js'
import { kstToday } from '@/lib/time'

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
