import { after } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { generateNeutralSummary } from '@/lib/gemini'

// 제출 확정 시 AI 중립 요약을 생성·저장한다 (PRD v1.1 4.6.4).
// 응답이 끝난 뒤 실행되므로 제출 흐름을 막지 않고,
// 실패해도 제출은 유효하다 — 요약은 보조라 null로 남긴다(우아한 실패).
export const scheduleSubmissionSummary = (
  supabase: SupabaseClient,
  submissionId: string,
  resultText: string,
  topic?: { title: string; instruction: string } | null,
) => {
  const run = async () => {
    try {
      const summary = await generateNeutralSummary(resultText, topic)
      if (!summary) return

      const { error } = await supabase
        .from('submissions')
        .update({ ai_summary: summary })
        .eq('id', submissionId)

      if (error) console.error('AI summary save error:', error)
    } catch (err) {
      console.error('AI summary generation error:', err)
    }
  }

  try {
    after(run)
  } catch {
    // after는 요청 스코프 밖(단위 테스트 등)에서 던질 수 있다 — 직접 실행으로 폴백
    void run()
  }
}
