import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWithPrompt } from '@/lib/gemini'
import { getChallengeState } from '@/lib/challenge-state'
import { MAX_GENERATIONS } from '@/lib/constants'

const assertAdmin = async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: '관리자만 접근할 수 있어요.' }, { status: 403 }) }
  }

  return { user, supabase }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await assertAdmin()
    if ('error' in auth && auth.error) return auth.error

    const challengeId = request.nextUrl.searchParams.get('challengeId')
    if (!challengeId) {
      return NextResponse.json({ error: '챌린지 ID가 필요해요.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    const [
      { count: seedCount },
      { count: userCount },
      { data: seedRows },
      { data: allUsers },
      { data: challengeSubmissions },
    ] = await Promise.all([
      serviceSupabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId)
        .eq('is_seed', true),
      serviceSupabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId)
        .eq('is_seed', false),
      serviceSupabase
        .from('submissions')
        .select('id, submitted_at, generations!inner(result_text), users(nickname)')
        .eq('challenge_id', challengeId)
        .eq('is_seed', true)
        .order('submitted_at', { ascending: false }),
      serviceSupabase
        .from('users')
        .select('id, nickname, is_admin, is_seed')
        .eq('is_seed', true)
        .order('nickname', { ascending: true }),
      serviceSupabase
        .from('submissions')
        .select('user_id')
        .eq('challenge_id', challengeId),
    ])

    const submittedUserIds = new Set((challengeSubmissions ?? []).map(s => s.user_id))

    const seeds = (seedRows ?? []).map(row => {
      const gen = Array.isArray(row.generations) ? row.generations[0] : row.generations
      const seedUser = Array.isArray(row.users) ? row.users[0] : row.users
      return {
        id: row.id,
        submitted_at: row.submitted_at,
        result_text: (gen as { result_text: string } | null)?.result_text ?? '',
        nickname: (seedUser as { nickname: string } | null)?.nickname ?? '익명',
      }
    })

    const eligibleUsers = (allUsers ?? []).map(u => ({
      id: u.id,
      nickname: u.nickname,
      hasSubmission: submittedUserIds.has(u.id),
    }))

    return NextResponse.json({
      seedCount: seedCount ?? 0,
      userCount: userCount ?? 0,
      seeds,
      eligibleUsers,
    })
  } catch (err) {
    console.error('Seed list error:', err)
    return NextResponse.json({ error: '시드 목록을 불러오지 못했어요.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await assertAdmin()
    if ('error' in auth && auth.error) return auth.error
    const { supabase } = auth

    const { challengeId, promptText, userId } = await request.json()

    if (!challengeId || !promptText?.trim() || !userId) {
      return NextResponse.json({ error: '챌린지, 사용자, 프롬프트가 필요해요.' }, { status: 400 })
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

    const serviceSupabase = await createServiceClient()

    const { data: seedUser } = await serviceSupabase
      .from('users')
      .select('id, nickname, is_admin, is_seed')
      .eq('id', userId)
      .single()

    if (!seedUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없어요.' }, { status: 404 })
    }

    if (seedUser.is_admin) {
      return NextResponse.json({ error: '운영자 계정은 시드 제출자로 쓸 수 없어요.' }, { status: 400 })
    }

    if (!seedUser.is_seed) {
      return NextResponse.json({ error: '시드 계정으로 지정된 사용자만 시드 제출자로 쓸 수 있어요.' }, { status: 400 })
    }

    const { data: existingSubmission } = await serviceSupabase
      .from('submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json({ error: '이 사용자는 이미 이 챌린지에 제출했어요.' }, { status: 409 })
    }

    const { count: generationCount } = await serviceSupabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)

    if ((generationCount ?? 0) >= MAX_GENERATIONS) {
      return NextResponse.json({ error: `이 사용자는 생성 한도(${MAX_GENERATIONS}회)를 모두 썼어요.` }, { status: 429 })
    }

    const attemptNumber = (generationCount ?? 0) + 1

    let resultText: string
    try {
      resultText = await generateWithPrompt({
        prompt: promptText.trim(),
        modelName: challenge.model_name,
        temperature: challenge.temperature,
        wrapperText: challenge.wrapper_text,
      })
    } catch (err) {
      console.error('Seed Gemini error:', err)
      return NextResponse.json({ error: 'AI 생성에 실패했어요. 잠시 후 다시 시도해주세요.' }, { status: 500 })
    }

    const { data: generation, error: genError } = await serviceSupabase
      .from('generations')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        prompt_text: promptText.trim(),
        result_text: resultText,
        attempt_number: attemptNumber,
      })
      .select()
      .single()

    if (genError || !generation) {
      console.error('Seed generation insert error:', genError)
      return NextResponse.json({ error: '시드 생성 결과 저장에 실패했어요.' }, { status: 500 })
    }

    const { data: submission, error: subError } = await serviceSupabase
      .from('submissions')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        generation_id: generation.id,
        is_seed: true,
      })
      .select()
      .single()

    if (subError || !submission) {
      console.error('Seed submission insert error:', subError)
      return NextResponse.json({ error: '시드 제출 저장에 실패했어요.' }, { status: 500 })
    }

    return NextResponse.json({ submission, generation, nickname: seedUser.nickname }, { status: 201 })
  } catch (err) {
    console.error('Seed route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
