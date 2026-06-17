import { createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import NewChallengeForm from './NewChallengeForm'

export const dynamic = 'force-dynamic'

// 활성 챌린지 충돌 여부는 서버에서 판정해 내린다. 생성은 폼이 /api/admin/challenges로 처리
// (admin 인증은 app/admin/layout.tsx가 보장 — ARCHITECTURE §2).
export default async function NewChallengePage() {
  const service = await createServiceClient()
  const { data } = await service
    .from('challenges')
    .select('id, title, submission_start_at, submission_end_at, voting_start_at, voting_end_at')
    .eq('is_active', true)

  let conflict: { title: string; state: 'submission' | 'voting' } | null = null
  const now = new Date()
  for (const c of data ?? []) {
    const s = getChallengeState(c, now)
    if (s === 'submission' || s === 'voting') {
      conflict = { title: c.title, state: s }
      break
    }
  }

  return <NewChallengeForm initialConflict={conflict} />
}
