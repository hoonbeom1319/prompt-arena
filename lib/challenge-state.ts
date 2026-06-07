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

export function getChallengeState(challenge: Challenge, now?: Date): ChallengeState {
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

export function getStateLabel(state: ChallengeState): string {
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

export function getStateColor(state: ChallengeState): string {
  switch (state) {
    case 'submission':
      return '#10B981'
    case 'voting':
      return '#F59E0B'
    case 'results':
      return '#D97757'
    case 'idle':
      return '#6B7280'
  }
}

export function getNextTransition(challenge: Challenge, now?: Date): { label: string; time: Date } | null {
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
