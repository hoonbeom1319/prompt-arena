import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import VoteClient from './VoteClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

// 인증·챌린지 확인은 서버에서. 출품작 목록·투표는 VoteClient가 /api/vote로 처리
// (목록은 3표 완료 후 갱신되는 인터랙션 데이터라 /api 경유가 맞음 — ARCHITECTURE §2.2).
export default async function VotePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = await createServiceClient()
  const { data: challenge } = await service
    .from('challenges')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!challenge) redirect('/')

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="투표" showBack backHref="/" statusLabel="투표 기간" statusVariant="accent" />
      <VoteClient challengeId={id} challengeTitle={challenge.title} />
    </div>
  )
}
