import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWithPrompt } from '@/lib/gemini'
import { getChallengeState } from '@/lib/challenge-state'

import { MAX_GENERATIONS } from '@/lib/constants'

const MAX_ATTEMPTS = MAX_GENERATIONS

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { challengeId, promptText } = await request.json()

    if (!challengeId || !promptText?.trim()) {
      return NextResponse.json({ error: '챌린지 ID와 프롬프트가 필요해요.' }, { status: 400 })
    }

    // Get challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    // Period check — server time
    const state = getChallengeState(challenge)
    if (state !== 'submission') {
      return NextResponse.json({ error: '현재 제출 기간이 아니에요.' }, { status: 403 })
    }

    // Count existing generations
    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: `최대 ${MAX_ATTEMPTS}번까지만 시도할 수 있어요.` }, { status: 429 })
    }

    const attemptNumber = (count ?? 0) + 1

    // Call Gemini
    let resultText: string
    try {
      resultText = await generateWithPrompt({
        prompt: promptText.trim(),
        modelName: challenge.model_name,
        temperature: challenge.temperature,
        wrapperText: challenge.wrapper_text,
      })
    } catch (err) {
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'AI 생성에 실패했어요. 잠시 후 다시 시도해주세요.' }, { status: 500 })
    }

    // Save generation (use service client to bypass RLS issues)
    const serviceSupabase = await createServiceClient()
    const { data: generation, error: insertError } = await serviceSupabase
      .from('generations')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        prompt_text: promptText.trim(),
        result_text: resultText,
        attempt_number: attemptNumber,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: '저장에 실패했어요.' }, { status: 500 })
    }

    return NextResponse.json({ generation, attemptsUsed: attemptNumber })
  } catch (err) {
    console.error('Generate route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
