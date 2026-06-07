import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWithPrompt } from '@/lib/gemini'
import { getChallengeState } from '@/lib/challenge-state'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있어요.' }, { status: 403 })
    }

    const { challengeId, promptText } = await request.json()

    if (!challengeId || !promptText?.trim()) {
      return NextResponse.json({ error: '챌린지 ID와 프롬프트가 필요해요.' }, { status: 400 })
    }

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    const state = getChallengeState(challenge)
    if (state !== 'submission') {
      return NextResponse.json({ error: '현재 제출 기간이 아니에요.' }, { status: 403 })
    }

    // Generate AI result
    const resultText = await generateWithPrompt({
      prompt: promptText.trim(),
      modelName: challenge.model_name,
      temperature: challenge.temperature,
      wrapperText: challenge.wrapper_text,
    })

    const serviceSupabase = await createServiceClient()

    // Create generation record (admin user)
    const { data: generation } = await serviceSupabase
      .from('generations')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        prompt_text: promptText.trim(),
        result_text: resultText,
        attempt_number: 1,
      })
      .select()
      .single()

    // Create seed submission
    const { data: submission } = await serviceSupabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        generation_id: generation!.id,
        is_seed: true,
      })
      .select()
      .single()

    return NextResponse.json({ submission, generation }, { status: 201 })
  } catch (err) {
    console.error('Seed route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
