import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) {
    redirect('/')
  }

  const state = getChallengeState(challenge)

  switch (state) {
    case 'submission':
      redirect(`/challenge/${id}/generate`)
    case 'voting':
      redirect(`/challenge/${id}/vote`)
    case 'results':
      redirect(`/challenge/${id}/results`)
    default:
      redirect('/')
  }
}
