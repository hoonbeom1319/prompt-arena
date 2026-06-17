import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { awardCoins, checkAndAwardBadge, COIN_AMOUNTS, COIN_REASONS } from '@/lib/coins'
import { scheduleSubmissionSummary } from '@/lib/ai/summary'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { challengeId, generationId } = await request.json()

    if (!challengeId || !generationId) {
      return NextResponse.json({ error: '챌린지 ID와 생성 ID가 필요해요.' }, { status: 400 })
    }

    // 서로 의존 없는 조회는 병렬로 — 챌린지·생성물 검증·중복 제출 확인을
    // 순차 왕복으로 쌓으면 제출 응답이 그만큼 느려진다.
    const [challengeRes, generationRes, existingRes] = await Promise.all([
      serviceSupabase.from('challenges').select('*').eq('id', challengeId).single(),
      serviceSupabase
        .from('generations')
        .select('id, result_text')
        .eq('id', generationId)
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .single(),
      serviceSupabase
        .from('submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .maybeSingle(),
    ])

    const challenge = challengeRes.data
    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없어요.' }, { status: 404 })
    }

    // Period check
    const state = getChallengeState(challenge)
    if (state !== 'submission') {
      return NextResponse.json({ error: '현재 제출 기간이 아니에요.' }, { status: 403 })
    }

    // Check generation belongs to user and challenge
    const generation = generationRes.data
    if (!generation) {
      return NextResponse.json({ error: '유효하지 않은 생성 결과예요.' }, { status: 400 })
    }

    // Check no existing submission
    if (existingRes.data) {
      return NextResponse.json({ error: '이미 이 챌린지에 제출했어요.' }, { status: 409 })
    }

    // Insert submission — 제출 자체가 핵심 행동이라 이것만 응답 전에 보장한다.
    const { data: submission, error: insertError } = await serviceSupabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        generation_id: generationId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: '제출에 실패했어요.' }, { status: 500 })
    }

    // AI 중립 요약 — 응답 후 생성·저장, 제출 흐름을 막지 않음 (PRD v1.1 4.6.4)
    // 주제는 참고 맥락 — 주제 내 접근 각도를 색인하기 위함 (적합성 판단은 프롬프트에서 금지)
    scheduleSubmissionSummary(serviceSupabase, submission.id, generation.result_text, {
      title: challenge.title,
      instruction: challenge.instruction,
    })

    // 코인·뱃지는 보상(부수 효과)이라 제출 응답을 막지 않는다 — 응답 후 처리하고,
    // 실패해도 제출은 유효하다(우아한 실패). 이로써 제출 응답의 왕복 수를 크게 줄인다.
    const rewardAfterSubmit = async () => {
      try {
        await awardCoins(serviceSupabase, user.id, COIN_AMOUNTS.SUBMIT_PROMPT, COIN_REASONS.SUBMIT_PROMPT, challengeId)

        const { count: submissionCount } = await serviceSupabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (submissionCount === 1) {
          await checkAndAwardBadge(serviceSupabase, user.id, 'first_submission')
        }
        if ((submissionCount ?? 0) >= 10) {
          await checkAndAwardBadge(serviceSupabase, user.id, 'participation_10')
        }
      } catch (err) {
        console.error('Submit reward error:', err)
      }
    }

    try {
      after(rewardAfterSubmit)
    } catch {
      // after는 요청 스코프 밖(단위 테스트 등)에서 던질 수 있다 — 직접 실행으로 폴백
      await rewardAfterSubmit()
    }

    return NextResponse.json({ submission, coinsAwarded: COIN_AMOUNTS.SUBMIT_PROMPT })
  } catch (err) {
    console.error('Submit route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
