import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import GenerateClient from './GenerateClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

// 초기 데이터(챌린지·내 생성기록·내 제출)는 서버에서 읽어 클라이언트 island에 내린다.
// 생성·제출(쓰기)은 GenerateClient가 /api로 호출 — 클라이언트는 supabase를 직접 만지지 않는다 (ARCHITECTURE §2).
export default async function GeneratePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = await createServiceClient()

  const { data: challenge } = await service
    .from('challenges')
    .select('id, title, instruction, category_id')
    .eq('id', id)
    .single()

  if (!challenge) redirect('/')

  let category: string | null = null
  if (challenge.category_id) {
    const { data: cat } = await service
      .from('categories')
      .select('name')
      .eq('id', challenge.category_id)
      .single()
    category = cat?.name ?? null
  }

  const [{ data: generations }, { data: submission }] = await Promise.all([
    service
      .from('generations')
      .select('id, prompt_text, result_text, attempt_number')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .order('attempt_number', { ascending: false }),
    service
      .from('submissions')
      .select('generation_id')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="프롬프트 만들기" showBack backHref="/" statusLabel="제출 기간" statusVariant="accent" />
      <GenerateClient
        challengeId={id}
        challenge={{ title: challenge.title, instruction: challenge.instruction, category }}
        initialGenerations={generations ?? []}
        initialSubmittedGenId={submission?.generation_id ?? null}
      />
    </div>
  )
}
