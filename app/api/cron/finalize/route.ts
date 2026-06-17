import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { finalizeChallenge } from '@/lib/challenge/finalize'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceSupabase = await createServiceClient()

  // 투표 마감 지난 챌린지 전체 조회
  const now = new Date().toISOString()
  const { data: candidates, error } = await serviceSupabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .lt('voting_end_at', now)

  if (error) {
    console.error('Cron finalize: fetch candidates failed', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results: Array<{ challengeId: string; skipped: boolean; finalizedCount: number }> = []

  for (const challenge of candidates ?? []) {
    const state = getChallengeState(challenge)
    if (state !== 'results') continue

    const result = await finalizeChallenge(serviceSupabase, challenge.id)
    results.push({ challengeId: challenge.id, ...result })
  }

  return NextResponse.json({ success: true, results })
}
