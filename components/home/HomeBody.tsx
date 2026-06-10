import Link from 'next/link'
import TopicCard from '@/components/TopicCard'
import CountdownCard from '@/components/CountdownCard'
import CountdownTimer from '@/components/CountdownTimer'
import StatsRow from '@/components/StatsRow'
import VoteTokens from '@/components/VoteTokens'
import RankBadge from '@/components/RankBadge'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import { Button } from '@/ds/button'
import { ChallengeState } from '@/lib/challenge-state'
import { MIN_PARTICIPANTS, MAX_GENERATIONS } from '@/lib/constants'

export interface TopRankEntry {
  id: string
  rank: number
  votes: number
}

export interface NextChallengePreview {
  title: string
  category?: string | null
  startAt: string
}

interface HomeBodyProps {
  challengeId: string
  title: string
  instruction: string
  category?: string | null
  state: ChallengeState
  countdownTarget?: string | null
  countdownLabel?: string | null
  participantCount: number
  submissionCount: number
  totalVotes: number
  userId?: string | null
  userGenCount: number
  userVoteCount: number
  userSubmissionId?: string | null
  userRank?: number | null
  userVotes?: number | null
  top3: TopRankEntry[]
  nextChallenge?: NextChallengePreview | null
}

function UserStatusCard({
  state,
  userId,
  userSubmissionId,
  userVoteCount,
  userRank,
  userVotes,
}: Pick<HomeBodyProps, 'state' | 'userId' | 'userSubmissionId' | 'userVoteCount' | 'userRank' | 'userVotes'>) {
  if (!userId) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-faint shrink-0" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          구경 중 — 로그인하면 내 상태가 표시돼요
        </div>
      </Card>
    )
  }

  if (state === 'submission') {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">내 제출</span>
          {userSubmissionId
            ? <Badge variant="success">제출 완료</Badge>
            : <Badge variant="outline">아직 안 함</Badge>}
        </div>
      </Card>
    )
  }

  if (state === 'voting') {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">내 투표</span>
          <span className="flex items-center gap-2">
            <VoteTokens used={userVoteCount} />
            <b className="text-xs tabular-nums">{userVoteCount}/3</b>
          </span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-primary">내 결과</span>
        {userRank != null
          ? <Badge variant="accent">{userRank}위 · {userVotes ?? 0}표</Badge>
          : <Badge variant="outline">미참가</Badge>}
      </div>
    </Card>
  )
}

function NextTopicCard({ next }: { next: NextChallengePreview }) {
  const startDate = new Date(next.startAt)
  const label = `${startDate.getMonth() + 1}/${startDate.getDate()} 시작`

  return (
    <Card className="p-4 bg-bg-subtle">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
          다음 주제 예고
        </span>
        <Badge variant="outline">{label}</Badge>
      </div>
      <div className="text-[15px] font-semibold text-text-primary">&ldquo;{next.title}&rdquo;</div>
      {next.category && (
        <p className="text-xs text-text-muted mt-1">카테고리 · {next.category}</p>
      )}
    </Card>
  )
}

function anonLabel(id: string) {
  return id.replace(/-/g, '').slice(0, 3)
}

export default function HomeBody(props: HomeBodyProps) {
  const {
    challengeId,
    title,
    instruction,
    category,
    state,
    countdownTarget,
    countdownLabel,
    participantCount,
    submissionCount,
    totalVotes,
    userId,
    userGenCount,
    userVoteCount,
    userSubmissionId,
    userRank,
    userVotes,
    top3,
    nextChallenge,
  } = props

  if (state === 'idle' && !countdownTarget) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-bg-base text-text-muted flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">진행 중인 챌린지가 없어요</h2>
          <p className="text-sm text-text-secondary mt-1.5">다음 챌린지를 기다려 주세요</p>
        </div>
        {nextChallenge && <div className="w-full"><NextTopicCard next={nextChallenge} /></div>}
        <Button asChild variant="secondary" className="mt-2">
          <Link href="/archive">지난 결과 보기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <TopicCard category={category} title={title} instruction={instruction} />

      {state === 'submission' && (
        <>
          {countdownTarget && countdownLabel && (
            <CountdownCard targetTime={countdownTarget} label={countdownLabel} />
          )}
          <StatsRow stats={[
            { value: String(participantCount), label: '참가자' },
            { value: `${MIN_PARTICIPANTS}↑`, label: '성립 기준' },
            { value: `${userGenCount}/${MAX_GENERATIONS}`, label: '내 시도' },
          ]} />
          <UserStatusCard
            state={state}
            userId={userId}
            userSubmissionId={userSubmissionId}
            userVoteCount={userVoteCount}
            userRank={userRank}
            userVotes={userVotes}
          />
          <div className="flex flex-col gap-2.5">
            {userSubmissionId ? (
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href={`/challenge/${challengeId}/generate`}>내 제출 보기</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="primary" size="lg" className="w-full">
                  <Link href={userId ? `/challenge/${challengeId}/generate` : '/auth/login'}>
                    프롬프트 만들기
                  </Link>
                </Button>
                {userId && (
                  <Button asChild variant="secondary" size="lg" className="w-full">
                    <Link href={`/challenge/${challengeId}/generate`}>내 제출 보기</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {state === 'voting' && (
        <>
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">내 투표</span>
              {countdownTarget && (
                <span className="text-xs text-text-muted">
                  투표 마감 <CountdownTimer targetTime={countdownTarget} label="" /> 남음
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <VoteTokens used={userVoteCount} />
              <b className="text-sm tabular-nums">{userVoteCount} / 3표</b>
            </div>
          </Card>
          <StatsRow stats={[
            { value: String(submissionCount), label: '출품작' },
            { value: String(totalVotes), label: '누적 투표' },
          ]} />
          <UserStatusCard
            state={state}
            userId={userId}
            userSubmissionId={userSubmissionId}
            userVoteCount={userVoteCount}
            userRank={userRank}
            userVotes={userVotes}
          />
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href={userId ? `/challenge/${challengeId}/vote` : '/auth/login'}>
              투표하러 가기
            </Link>
          </Button>
        </>
      )}

      {state === 'results' && (
        <>
          {top3.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-accent text-[11px] font-semibold uppercase tracking-wider">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  TOP 3
                </span>
                <span className="text-xs text-text-muted">최종 집계</span>
              </div>
              <div className="flex flex-col gap-2">
                {top3.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={entry.rank} />
                      <span className="text-sm">익명#{anonLabel(entry.id)}</span>
                    </span>
                    <b className="text-sm tabular-nums">{entry.votes}표</b>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <UserStatusCard
            state={state}
            userId={userId}
            userSubmissionId={userSubmissionId}
            userVoteCount={userVoteCount}
            userRank={userRank}
            userVotes={userVotes}
          />
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href={`/challenge/${challengeId}/results`}>전체 결과 보기</Link>
          </Button>
          {nextChallenge && <NextTopicCard next={nextChallenge} />}
        </>
      )}
    </div>
  )
}
