import Link from 'next/link'
import TopicCard from './TopicCard'
import CountdownCard from './CountdownCard'
import CountdownTimer from './CountdownTimer'
import StatsRow from '@/components/StatsRow'
import VoteTokens from '@/components/VoteTokens'
import RankBadge from '@/components/RankBadge'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import { Button } from '@/ds/button'
import { type ChallengeState } from '@/lib/challenge/challenge-state'
import { MAX_GENERATIONS, MAX_VOTES } from '@/lib/constants'
import { isoToKstDate } from '@/lib/time'
import type { TopRankEntry, NextChallengePreview } from '@/lib/challenge/home-data'
import { IconUsers, IconLock, IconMoon, IconCheck, IconTrophy } from '@/ds/icons'

interface ChallengeInfo {
  id: string
  title: string
  instruction: string
  category?: string | null
  votingStartAt?: string | null
}

interface Stats {
  participants: number
  submissions: number
  totalVotes: number
}

interface UserInfo {
  id: string
  genCount: number
  voteCount: number
  submissionId?: string | null
  rank?: number | null
  votes?: number | null
}

interface HomeBodyProps {
  state: ChallengeState
  challenge?: ChallengeInfo
  countdown?: { target: string; label: string } | null
  stats?: Stats
  user?: UserInfo | null
  top3?: TopRankEntry[]
  nextChallenge?: NextChallengePreview | null
}

function UserStatusCard({
  state,
  user,
}: {
  state: ChallengeState
  user?: UserInfo | null
}) {
  if (!user) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <IconUsers className="text-text-faint shrink-0" />
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
          {user.submissionId ? (
            <Badge variant="success">제출 완료</Badge>
          ) : (
            <Badge variant="outline">아직 안 함</Badge>
          )}
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
            <VoteTokens used={user.voteCount} />
            <b className="text-xs tabular-nums">{user.voteCount}/3</b>
          </span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-primary">내 결과</span>
        {user.rank != null ? (
          <Badge variant="accent">
            {user.rank}위 · {user.votes ?? 0}표
          </Badge>
        ) : (
          <Badge variant="outline">미참가</Badge>
        )}
      </div>
    </Card>
  )
}

function NextTopicCard({ next }: { next: NextChallengePreview }) {
  // KST 달력 기준 월/일 — 뷰어 타임존과 무관하게 못박는다.
  const [, m, d] = isoToKstDate(next.startAt).split('-')
  const label = `${Number(m)}/${Number(d)} 시작`

  return (
    <Card className="p-4 bg-bg-subtle">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
          다음 주제 예고
        </span>
        <Badge variant="outline">{label}</Badge>
      </div>
      <div className="text-[15px] font-semibold text-text-primary">
        &ldquo;{next.title}&rdquo;
      </div>
      {next.category && (
        <p className="text-xs text-text-muted mt-1">
          카테고리 · {next.category}
        </p>
      )}
    </Card>
  )
}

// 투표 단계 — 3표를 다 쓰기 전엔 다음 주제를 가린 채 동기만 보여준다.
function LockedNextTopicCard({ votesUsed }: { votesUsed: number }) {
  return (
    <Card className="p-4 bg-bg-subtle">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
          다음 주제 예고
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
          <IconLock width={12} height={12} />
          가림
        </span>
      </div>
      <div className="text-[15px] font-semibold text-text-muted blur-[5px] select-none" aria-hidden="true">
        &ldquo;다음 주 주제가 여기에 공개돼요&rdquo;
      </div>
      <p className="text-xs text-text-secondary mt-2">
        투표 {MAX_VOTES}개를 모두 하면 다음 주 주제가 공개돼요 ({votesUsed}/{MAX_VOTES})
      </p>
    </Card>
  )
}

const anonLabel = (id: string) => id.replace(/-/g, '').slice(0, 3)

export default function HomeBody({
  state,
  challenge,
  countdown,
  stats,
  user,
  top3 = [],
  nextChallenge,
}: HomeBodyProps) {
  if (state === 'idle' || !challenge) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-bg-base text-text-muted flex items-center justify-center">
          <IconMoon width={30} height={30} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            진행 중인 챌린지가 없어요
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            다음 챌린지를 기다려 주세요
          </p>
        </div>
        {nextChallenge && (
          <div className="w-full">
            <NextTopicCard next={nextChallenge} />
          </div>
        )}
        <Button asChild variant="secondary" className="mt-2">
          <Link href="/archive">지난 결과 보기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <TopicCard
        category={challenge.category}
        title={challenge.title}
        instruction={challenge.instruction}
      />

      {state === 'submission' && (
        <>
          {countdown && (
            <CountdownCard
              targetTime={countdown.target}
              label={countdown.label}
            />
          )}
          <StatsRow
            stats={[
              { value: String(stats?.participants ?? 0), label: '참가자' },
              {
                value: `${user?.genCount ?? 0}/${MAX_GENERATIONS}`,
                label: '내 시도',
              },
            ]}
          />
          <UserStatusCard state={state} user={user} />

          {user?.submissionId ? (
            <>
              <Card className="p-6 flex flex-col items-center text-center gap-3 bg-accent-light">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                  <IconCheck width={28} height={28} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <div className="text-[17px] font-bold text-text-primary">
                    제출이 완료됐어요
                  </div>
                  {challenge.votingStartAt && (
                    <p className="text-sm text-text-secondary mt-1">
                      투표는 내일 열려요
                    </p>
                  )}
                </div>
              </Card>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href={`/challenge/${challenge.id}/generate`}>
                  내 제출 보기
                </Link>
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Button asChild variant="primary" size="lg" className="w-full">
                <Link
                  href={
                    user
                      ? `/challenge/${challenge.id}/generate`
                      : '/auth/login'
                  }
                >
                  프롬프트 만들기
                </Link>
              </Button>
              {user && (
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  <Link href={`/challenge/${challenge.id}/generate`}>
                    내 제출 보기
                  </Link>
                </Button>
              )}
            </div>
          )}

          {!user?.submissionId && (
            <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:items-start">
              <Card className="p-4">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3.5">
                  어떻게 참여하나요?
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    {
                      step: '1',
                      title: '프롬프트 작성',
                      desc: `챌린지 주제에 맞는 AI 프롬프트를 작성해요. 최대 ${MAX_GENERATIONS}번 시도할 수 있어요.`,
                    },
                    {
                      step: '2',
                      title: 'AI 응답 확인',
                      desc: 'Gemini AI가 내 프롬프트로 응답을 생성해요. 마음에 드는 걸 골라 제출하세요.',
                    },
                    {
                      step: '3',
                      title: '투표 참여',
                      desc: '제출 기간이 끝나면 다른 참가자들의 결과물에 투표할 수 있어요.',
                    },
                    {
                      step: '4',
                      title: '순위 & 코인',
                      desc: '투표로 순위가 결정되고, 순위에 따라 코인이 지급돼요.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary mb-0.5">
                          {item.title}
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                  코인 보상
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '프롬프트 제출', coins: '+5' },
                    { label: '투표 1회', coins: '+1' },
                    { label: '1등', coins: '+100' },
                    { label: '2등', coins: '+50' },
                    { label: '3등', coins: '+25' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-base border border-border rounded-full text-[12px]"
                    >
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-bold text-accent">
                        {item.coins}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {state === 'voting' && (
        <>
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                내 투표
              </span>
              {countdown && (
                <span className="text-xs text-text-muted">
                  투표 마감{' '}
                  <CountdownTimer targetTime={countdown.target} label="" /> 남음
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <VoteTokens used={user?.voteCount ?? 0} />
              <b className="text-sm tabular-nums">
                {user?.voteCount ?? 0} / 3표
              </b>
            </div>
          </Card>
          <StatsRow
            stats={[
              { value: String(stats?.submissions ?? 0), label: '출품작' },
              { value: String(stats?.totalVotes ?? 0), label: '누적 투표' },
            ]}
          />
          <UserStatusCard state={state} user={user} />
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link
              href={user ? `/challenge/${challenge.id}/vote` : '/auth/login'}
            >
              투표하러 가기
            </Link>
          </Button>
          {/* 다음 주제 예고 — 3표 완료 시 공개, 미완료 시 동기 부여용 잠금 카드 */}
          {nextChallenge &&
            ((user?.voteCount ?? 0) >= MAX_VOTES ? (
              <NextTopicCard next={nextChallenge} />
            ) : (
              <LockedNextTopicCard votesUsed={user?.voteCount ?? 0} />
            ))}
        </>
      )}

      {state === 'results' && (
        <>
          {top3.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-accent text-[11px] font-semibold uppercase tracking-wider">
                  <IconTrophy width={17} height={17} />
                  TOP 3
                </span>
                <span className="text-xs text-text-muted">최종 집계</span>
              </div>
              <div className="flex flex-col gap-2">
                {top3.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between"
                  >
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
          <UserStatusCard state={state} user={user} />
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href={`/challenge/${challenge.id}/results`}>
              전체 결과 보기
            </Link>
          </Button>
          {nextChallenge && <NextTopicCard next={nextChallenge} />}
        </>
      )}
    </div>
  )
}
