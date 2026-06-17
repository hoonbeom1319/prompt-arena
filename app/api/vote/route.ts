import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { awardCoins, COIN_AMOUNTS, COIN_REASONS } from '@/lib/coin'
import { seededShuffle } from '@/lib/shuffle'

const MAX_VOTES = 3

// 투표 목록 조회 — RLS(generations_owner)로 남의 결과물을 못 읽으므로 service client로 우회한다.
// 블라인드 규칙은 여기서 강제: prompt_text는 본인이 3표를 다 써서 공개(reveal)된 경우에만 내려준다.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const challengeId = request.nextUrl.searchParams.get('challengeId')
    if (!challengeId) {
      return NextResponse.json({ error: '챌린지 ID가 필요해요.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    // 두 쿼리는 서로 독립적이므로 병렬로 던진다 (순차 시 왕복 2회 → 1회).
    const [{ data: myVotes }, { data: subs }] = await Promise.all([
      serviceSupabase
        .from('votes')
        .select('submission_id')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId),
      serviceSupabase
        .from('submissions')
        .select('id, ai_summary, generations!inner(result_text, prompt_text)')
        .eq('challenge_id', challengeId)
        .order('id'),
    ])

    const votedSubmissionIds = (myVotes ?? []).map(v => v.submission_id)
    const revealed = votedSubmissionIds.length >= MAX_VOTES

    const mapped = (subs ?? []).map((s: {
      id: string
      ai_summary: string | null
      generations: { result_text: string; prompt_text: string } | Array<{ result_text: string; prompt_text: string }>
    }) => {
      const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
      return {
        id: s.id,
        result_text: gen?.result_text ?? '',
        prompt_text: revealed ? (gen?.prompt_text ?? '') : null,
        ai_summary: s.ai_summary ?? null,
      }
    })

    // 노출 순서 랜덤화 (PRD v1.1 4.6.1) — 투표자마다 다르게, 같은 투표자는 재조회에도 동일하게.
    // id 정렬 후 user+challenge 시드로 섞어 순서를 결정적으로 만든다.
    const submissions = seededShuffle(mapped, `${user.id}:${challengeId}`)

    return NextResponse.json({ submissions, votedSubmissionIds, votesUsed: votedSubmissionIds.length, revealed })
  } catch (err) {
    console.error('Vote list error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { challengeId, submissionId } = await request.json()

    if (!challengeId || !submissionId) {
      return NextResponse.json({ error: '챌린지 ID와 제출 ID가 필요해요.' }, { status: 400 })
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

    // Period check — voting only
    const state = getChallengeState(challenge)
    if (state !== 'voting') {
      return NextResponse.json({ error: '현재 투표 기간이 아니에요.' }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()

    // 보유 표 수 / 중복 투표 검사는 서로 독립적이므로 병렬로 던진다.
    const [{ count: voteCount }, { data: existingVote }] = await Promise.all([
      serviceSupabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId),
      serviceSupabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('submission_id', submissionId)
        .single(),
    ])

    if ((voteCount ?? 0) >= MAX_VOTES) {
      return NextResponse.json({ error: '이미 3표를 모두 사용했어요.' }, { status: 429 })
    }

    if (existingVote) {
      return NextResponse.json({ error: '이미 이 제출물에 투표했어요.' }, { status: 409 })
    }

    // Insert vote
    const { data: vote, error: insertError } = await serviceSupabase
      .from('votes')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        submission_id: submissionId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Vote insert error:', insertError)
      return NextResponse.json({ error: '투표에 실패했어요.' }, { status: 500 })
    }

    // Award coin
    await awardCoins(serviceSupabase, user.id, COIN_AMOUNTS.CAST_VOTE, COIN_REASONS.CAST_VOTE, challengeId)

    const newVoteCount = (voteCount ?? 0) + 1

    return NextResponse.json({
      vote,
      coinsAwarded: COIN_AMOUNTS.CAST_VOTE,
      votesUsed: newVoteCount,
      revealed: newVoteCount >= MAX_VOTES,
    })
  } catch (err) {
    console.error('Vote route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
