import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import VoteCard from '@/components/VoteCard'

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
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, instruction, voting_end_at')
    .eq('id', id)
    .single()

  if (!challenge) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Header />
        <div className="container" style={{ paddingTop: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>챌린지를 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  // Get ranked submissions with prompt texts and vote counts
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      final_rank,
      final_vote_count,
      user_id,
      generations!inner(prompt_text, result_text)
    `)
    .eq('challenge_id', id)
    .not('final_rank', 'is', null)
    .order('final_rank', { ascending: true })
    .limit(20)

  // Get unranked if results not finalized yet — just count votes
  let rankedSubs: RankedSubmission[] = []

  if (submissions && submissions.length > 0) {
    // Results finalized
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
    // Results not finalized — compute from vote counts
    const { data: allSubs } = await supabase
      .from('submissions')
      .select(`
        id,
        user_id,
        generations!inner(prompt_text, result_text)
      `)
      .eq('challenge_id', id)
      .eq('is_seed', false)

    if (allSubs) {
      const subIds = allSubs.map((s: { id: string }) => s.id)

      // Count votes per submission
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

      const sorted = [...allSubs].sort((a: { id: string }, b: { id: string }) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))

      rankedSubs = sorted.map((s: {
        id: string;
        user_id: string;
        generations: { prompt_text: string; result_text: string } | Array<{ prompt_text: string; result_text: string }>;
      }, i: number) => {
        const gen = Array.isArray(s.generations) ? s.generations[0] : s.generations
        return {
          id: s.id,
          rank: i + 1,
          final_vote_count: voteCounts[s.id] ?? 0,
          result_text: gen?.result_text ?? '',
          prompt_text: gen?.prompt_text ?? '',
          user_nickname: userMap[s.user_id] ?? '익명',
        }
      })
    }
  }

  const rankColors: Record<number, string> = {
    1: '#F59E0B',
    2: '#6B7280',
    3: '#CD7F32',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <Link href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
          ← 홈으로
        </Link>

        {/* Challenge header */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #FFF 0%, var(--accent-light) 100%)' }}>
          <div className="badge badge-accent" style={{ marginBottom: '12px' }}>
            결과 공개
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {challenge.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
            {challenge.instruction}
          </p>

          {/* Share button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href)
              }
            }}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            링크 복사
          </button>
        </div>

        {/* Winner highlight */}
        {rankedSubs.length > 0 && rankedSubs[0] && (
          <div className="card" style={{
            padding: '24px',
            marginBottom: '24px',
            border: `2px solid ${rankColors[1]}`,
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>우승자</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {rankedSubs[0].user_nickname}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: rankColors[1] }}>
                  {rankedSubs[0].final_vote_count}표
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              우승 프롬프트
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              padding: '10px 12px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '6px',
              fontFamily: 'monospace',
              marginBottom: '12px',
            }}>
              {rankedSubs[0].prompt_text}
            </p>

            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              AI 응답
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {rankedSubs[0].result_text}
            </p>
          </div>
        )}

        {/* All rankings */}
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
          전체 순위
        </h2>

        {rankedSubs.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>아직 제출된 결과가 없어요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
