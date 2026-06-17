import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'
import Podium from './Podium'
import GeminiOutputLabel from '@/components/GeminiOutputLabel'
import CopyLinkButton from './CopyLinkButton'
import ResultList from './ResultList'
import { rankSubmissions } from '@/lib/challenge/ranking'
import { getChallengeState } from '@/lib/challenge/challenge-state'
import { Card } from '@/ds/card'
import { IconTrophy } from '@/ds/icons'

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
  attemptNumber: number
  isMe?: boolean
}

export const dynamic = 'force-dynamic'

function anonLabel(id: string) {
  return id.replace(/-/g, '').slice(0, 3)
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await service
    .from('challenges')
    .select('id, title, instruction, submission_start_at, submission_end_at, voting_start_at, voting_end_at')
    .eq('id', id)
    .single()

  if (!challenge) {
    return (
      <div className="min-h-screen bg-bg-base">
        <AppBar title="결과 · 순위" showBack backHref="/" statusLabel="결과 발표" statusVariant="accent" />
        <div className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-12 text-center">
          <p className="text-text-muted">챌린지를 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  // 결과는 투표 마감 이후에만 공개한다. 투표 진행 중에 결과 페이지로 들어와
  // 집계 중인 순위·득표를 미리 보는 것을 막는다 (간접적 투표 상황 노출 방지).
  const state = getChallengeState(challenge)
  if (state !== 'results') {
    const isVoting = state === 'voting'
    return (
      <div className="min-h-screen bg-bg-base">
        <AppBar title="결과 · 순위" showBack backHref="/" statusLabel="결과 발표" statusVariant="accent" />
        <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10">
          <Card className="p-10 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">🗳️</div>
            <h2 className="text-lg font-bold text-text-primary mb-1.5">아직 결과가 공개되지 않았어요</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {isVoting
                ? '투표가 진행 중이에요. 결과는 투표가 마감된 뒤에 공개돼요.'
                : '결과는 투표가 마감된 뒤에 공개돼요.'}
            </p>
            {isVoting && (
              <Link
                href={`/challenge/${id}/vote`}
                className="inline-block mt-5 px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold no-underline"
              >
                투표하러 가기
              </Link>
            )}
          </Card>
        </main>
      </div>
    )
  }

  const { data: submissions } = await service
    .from('submissions')
    .select(`id, final_rank, final_vote_count, user_id, submitted_at, generations!inner(prompt_text, result_text, attempt_number)`)
    .eq('challenge_id', id)
    .not('final_rank', 'is', null)
    .order('final_rank', { ascending: true })
    .limit(20)

  let rankedSubs: RankedSubmission[] = []

  if (submissions && submissions.length > 0) {
    const userIds = submissions.map(s => s.user_id)
    const { data: users } = await service.from('users').select('id, nickname').in('id', userIds)
    const userMap: Record<string, string> = {}
    users?.forEach(u => { userMap[u.id] = u.nickname })

    rankedSubs = submissions.map(s => {
      const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
      return {
        id: s.id,
        rank: s.final_rank,
        final_vote_count: s.final_vote_count ?? 0,
        result_text: gen?.result_text ?? '',
        prompt_text: gen?.prompt_text ?? '',
        user_nickname: userMap[s.user_id] ?? '익명',
        attemptNumber: gen?.attempt_number ?? 1,
        isMe: user?.id === s.user_id,
      }
    })
  } else {
    const { data: allSubs } = await service
      .from('submissions')
      .select(`id, user_id, submitted_at, generations!inner(prompt_text, result_text, attempt_number)`)
      .eq('challenge_id', id)

    if (allSubs) {
      // 득표 집계 — 제출물마다 count 쿼리를 돌리면 N+1이라, 챌린지 전체 표를
      // 한 번에 가져와 메모리에서 제출물별로 합산한다.
      const voteCounts: Record<string, number> = {}
      for (const sub of allSubs) voteCounts[sub.id] = 0

      const { data: voteRows } = await service
        .from('votes')
        .select('submission_id')
        .eq('challenge_id', id)

      for (const v of (voteRows ?? []) as Array<{ submission_id: string }>) {
        if (voteCounts[v.submission_id] !== undefined) voteCounts[v.submission_id] += 1
      }

      const userIds = allSubs.map(s => s.user_id)
      const { data: users } = await service.from('users').select('id, nickname').in('id', userIds)
      const userMap: Record<string, string> = {}
      users?.forEach(u => { userMap[u.id] = u.nickname })

      const rankable = allSubs.map(s => {
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
        attemptNumber: s.attemptNumber,
        isMe: user?.id === s.user_id,
      }))
    }
  }

  // 전체 순위는 상위 20위까지만 노출한다. 주 쿼리는 .limit(20)으로 이미 잘리지만,
  // 폴백 경로(순위 미집계)는 순위 계산을 위해 전부 가져오므로 여기서 잘라 일관성을 맞춘다.
  rankedSubs = rankedSubs.slice(0, 20)

  const winner = rankedSubs.find(s => s.rank === 1)
  const podiumEntries = rankedSubs
    .filter(s => s.rank <= 3)
    .map(s => ({ id: s.id, rank: s.rank, votes: s.final_vote_count, label: anonLabel(s.id), attemptNumber: s.attemptNumber }))

  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="결과 · 순위" showBack backHref="/" statusLabel="결과 발표" statusVariant="accent" />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-10 flex flex-col gap-3.5">
        <div className="text-center">
          <div className="flex justify-center text-accent mb-1">
            <IconTrophy />
          </div>
          <h2 className="text-[22px] font-extrabold text-text-primary tracking-tight">최종 결과</h2>
          <p className="text-xs text-text-muted mt-1">&ldquo;{challenge.title}&rdquo;</p>
        </div>

        {podiumEntries.length > 0 && <Podium entries={podiumEntries} />}

        {winner && (
          <Card className="p-4 border-accent-mid">
            <div className="flex items-center gap-1.5 text-accent text-[15px] font-semibold mb-3">
              <IconTrophy width={15} height={15} />
              우승작
            </div>
            {winner.prompt_text && (
              <div className="mb-3">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  프롬프트
                </div>
                <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
                  {winner.prompt_text}
                </p>
              </div>
            )}
            <GeminiOutputLabel className="mb-1.5" />
            <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
              {winner.result_text}
            </p>

            {/* 결과 페이지 공유 — 우승작 카드 하단에 구분선과 함께 둔다. */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
              <span className="text-xs text-text-muted truncate tabular-nums">
                /challenge/{id}/results
              </span>
              <CopyLinkButton />
            </div>
          </Card>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              전체 순위
            </div>
            {rankedSubs.length > 0 && (
              <span className="text-[11px] text-text-muted tabular-nums">
                상위 {rankedSubs.length}개
              </span>
            )}
          </div>
          {rankedSubs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-base text-text-muted">아직 제출된 결과가 없어요.</p>
            </Card>
          ) : (
            <ResultList subs={rankedSubs} />
          )}
        </div>
      </main>
    </div>
  )
}
