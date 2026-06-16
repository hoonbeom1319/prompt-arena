import { createServiceClient } from '@/lib/supabase/server'
import SeedClient from './SeedClient'

export const dynamic = 'force-dynamic'

// 활성 챌린지 목록은 서버에서 읽어 내린다. 시드 조회·추가는 SeedClient가 /api/admin/seed로 처리
// (admin 인증은 app/admin/layout.tsx가 보장 — ARCHITECTURE §2).
export default async function AdminSeedPage() {
  const service = await createServiceClient()
  const { data } = await service
    .from('challenges')
    .select('id, title, instruction, submission_start_at, submission_end_at, voting_start_at, voting_end_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return <SeedClient initialChallenges={data ?? []} />
}
