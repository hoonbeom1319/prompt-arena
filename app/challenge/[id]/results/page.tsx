import { createServiceClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import VoteCard from '@/components/VoteCard'
import CopyLinkButton from './CopyLinkButton'
import { rankSubmissions } from '@/lib/ranking'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

interface PageProps {
  params: Promise<{ id: string }>
}

interface RankedSubmission {
  id: string
  rank: number
  final_vote_count: number
  result_text: string
  prompt_text: string
  user_nickname: string
}

export const dynamic = 'force-dynamic'

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params
  // 결과는 전체 공개(PRD §4.0-E). 남의 generation·닉네임을 읽어야 하므로 RLS를 우회하는 service client 사용.
  const supabase = await createServiceClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, instruction, voting_end_at')
    .eq('id', id)
    .single()

  if (!challenge) {
    return (
      <div className="min-h-screen bg-bg-base">
        <Header />
        <div className="container pt-12 text-center">
          <p className="text-text-muted">챌린지를 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`id, final_rank, final_vote_count, user_id, generations!inner(prompt_text, result_text)`)
    .eq('challenge_id', id)
    .not('final_rank', 'is', null)
    .order('final_rank', { ascending: true })
    .limit(20)

  let rankedSubs: RankedSubmission[] = []

  if (submissions && submissions.length > 0) {
    const userIds = submissions.map((s: { user_id: string }) => s.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds)

    const userMap: Record<string, string> = {}
    users?.forEach((u: { id: string; nickname: string }) => { userMap[u.id] = u.nickname })

    rankedSubs = submissions.map((s: {
      id: string;
      final_rank: number;
      final_vote_count: number;
      user_id: string;
      generations: { prompt_text: string; result_text: string } | Array<{ prompt_text: string; result_text: string }>;
    }) => {
      const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
      return {
        id: s.id,
        rank: s.final_rank,
        final_vote_count: s.final_vote_count ?? 0,
        result_text: gen?.result_text ?? '',
        prompt_text: gen?.prompt_text ?? '',
        user_nickname: userMap[s.user_id] ?? '익명',
      }
    })
  } else {
    const { data: allSubs } = await supabase
      .from('submissions')
      .select(`id, user_id, submitted_at, generations!inner(prompt_text, result_text, attempt_number)`)
      .eq('challenge_id', id)
      .eq('is_seed', false)

    if (allSubs) {
      const subIds = allSubs.map((s: { id: string }) => s.id)
      const voteCounts: Record<string, number> = {}
      for (const subId of subIds) {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', subId)
        voteCounts[subId] = count ?? 0
      }

      const userIds = allSubs.map((s: { user_id: string }) => s.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds)

      const userMap: Record<string, string> = {}
      users?.forEach((u: { id: string; nickname: string }) => { userMap[u.id] = u.nickname })

      // finalize와 동일한 규칙(득표→시도수→제출시각, 동률 공동순위)으로 미리보기 순위 계산
      const rankable = allSubs.map((s: {
        id: string;
        user_id: string;
        submitted_at: string;
        generations: { prompt_text: string; result_text: string; attempt_number: number } | Array<{ prompt_text: string; result_text: string; attempt_number: number }>;
      }) => {
        const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
        return {
          id: s.id,
          user_id: s.user_id,
          voteCount: voteCounts[s.id] ?? 0,
          attemptNumber: gen?.attempt_number ?? 1,
          submittedAt: s.submitted_at,
          result_text: gen?.result_text ?? '',
          prompt_text: gen?.prompt_text ?? '',
        }
      })

      rankedSubs = rankSubmissions(rankable).map(s => ({
        id: s.id,
        rank: s.rank,
        final_vote_count: s.voteCount,
        result_text: s.result_text,
        prompt_text: s.prompt_text,
        user_nickname: userMap[s.user_id] ?? '익명',
      }))
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Header />

      <main className="container pt-8 pb-16">
        <Link
          href="/"
          className="text-sm text-text-secondary no-underline inline-flex items-center gap-1 mb-5 hover:text-text-primary transition-colors"
        >
          ← 홈으로
        </Link>

        {/* Challenge header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-white to-accent-light">
          <Badge variant="accent" className="mb-3">결과 공개</Badge>
          <h1 className="text-[22px] font-bold text-text-primary mb-2">{challenge.title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{challenge.instruction}</p>
          <CopyLinkButton />
        </Card>

        {/* Winner highlight */}
        {rankedSubs.length > 0 && rankedSubs[0] && (
          <Card className="p-6 mb-6 border-2 border-[#F59E0B] bg-gradient-to-br from-[#FFFBEB] to-white">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-3xl" aria-hidden="true">🏆</span>
              <div>
                <div className="text-[13px] text-text-muted font-medium">우승자</div>
                <div className="text-lg font-bold text-text-primary">{rankedSubs[0].user_nickname}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold text-[#F59E0B]">{rankedSubs[0].final_vote_count}표</div>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              우승 프롬프트
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed px-3 py-2.5 bg-white/80 rounded-md font-mono mb-3">
              {rankedSubs[0].prompt_text}
            </p>

            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              AI 응답
            </div>
            <p className="text-[15px] text-text-primary leading-[1.7] whitespace-pre-wrap">
              {rankedSubs[0].result_text}
            </p>
          </Card>
        )}

        {/* All rankings */}
        <h2 className="text-base font-bold text-text-primary mb-4">전체 순위</h2>

        {rankedSubs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-base text-text-muted">아직 제출된 결과가 없어요.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {rankedSubs.map(sub => (
              <VoteCard
                key={sub.id}
                submissionId={sub.id}
                rank={sub.rank}
                resultText={sub.result_text}
                promptText={sub.prompt_text}
                voteCount={sub.final_vote_count}
                hasVoted={false}
                isRevealed={true}
                onVote={() => {}}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
