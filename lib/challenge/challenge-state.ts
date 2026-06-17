export type ChallengeState = 'submission' | 'voting' | 'results' | 'idle'

export interface Challenge {
  id: string
  title: string
  instruction: string
  category_id: string | null
  challenge_type: string
  submission_start_at: string
  submission_end_at: string
  voting_start_at: string
  voting_end_at: string
  model_name: string
  temperature: number
  wrapper_text: string | null
  created_by: string
  is_active: boolean
  created_at: string
}

// 상태 판정에 필요한 건 기간 4필드뿐이다 — 전체 Challenge가 아니라 부분만 받아
// 결과 페이지처럼 필요한 컬럼만 select한 객체도 그대로 넘길 수 있게 한다.
export type ChallengeTiming = Pick<
  Challenge,
  'submission_start_at' | 'submission_end_at' | 'voting_start_at' | 'voting_end_at'
>

export const getChallengeState = (challenge: ChallengeTiming, now?: Date): ChallengeState => {
  const current = now ?? new Date()
  const submissionStart = new Date(challenge.submission_start_at)
  const submissionEnd = new Date(challenge.submission_end_at)
  const votingStart = new Date(challenge.voting_start_at)
  const votingEnd = new Date(challenge.voting_end_at)

  if (current >= submissionStart && current <= submissionEnd) {
    return 'submission'
  }

  if (current >= votingStart && current <= votingEnd) {
    return 'voting'
  }

  if (current > votingEnd) {
    return 'results'
  }

  return 'idle'
}

export const getStateLabel = (state: ChallengeState): string => {
  switch (state) {
    case 'submission':
      return '제출 중'
    case 'voting':
      return '투표 중'
    case 'results':
      return '결과 공개'
    case 'idle':
      return '대기 중'
  }
}

export const getStateColor = (state: ChallengeState): string => {
  switch (state) {
    case 'submission':
      return 'var(--success)'
    case 'voting':
      return 'var(--accent)'
    case 'results':
      return 'var(--accent)'
    case 'idle':
      return 'var(--text-muted)'
  }
}

export const getNextTransition = (challenge: ChallengeTiming, now?: Date): { label: string; time: Date } | null => {
  const current = now ?? new Date()
  const state = getChallengeState(challenge, current)

  switch (state) {
    case 'submission':
      return { label: '제출 마감', time: new Date(challenge.submission_end_at) }
    case 'voting':
      return { label: '투표 마감', time: new Date(challenge.voting_end_at) }
    case 'idle': {
      const submissionStart = new Date(challenge.submission_start_at)
      if (current < submissionStart) {
        return { label: '제출 시작', time: submissionStart }
      }
      const votingStart = new Date(challenge.voting_start_at)
      if (current < votingStart) {
        return { label: '투표 시작', time: votingStart }
      }
      return null
    }
    case 'results':
      return null
  }
}
