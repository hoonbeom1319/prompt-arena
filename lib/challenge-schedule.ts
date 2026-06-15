// 챌린지 일정 공용 유틸 — 생성/수정 API가 함께 쓴다.
// 기조: 운영자는 *제출일 하나*만 정하고, 나머지(제출 마감·투표 시작/마감)는
// 2일 주기로 자동 파생한다 (PRD v1.2). 저장은 항상 ISO(UTC).

export interface ScheduleTimes {
  submission_start_at: string
  submission_end_at: string
  voting_start_at: string
  voting_end_at: string
}

// 제출일(YYYY-MM-DD, 로컬) 하나로 2일 주기 4시각을 파생한다.
// 1일차 제출 종일 / 2일차 투표 종일 → 투표 마감(자정) 직후 결과 자동.
export const deriveTwoDayISO = (submissionDate: string): ScheduleTimes => {
  const endOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 0)
    return x
  }
  const submissionStart = new Date(`${submissionDate}T00:00:00`)
  const votingStart = new Date(submissionStart)
  votingStart.setDate(votingStart.getDate() + 1)
  return {
    submission_start_at: submissionStart.toISOString(),
    submission_end_at: endOfDay(submissionStart).toISOString(),
    voting_start_at: votingStart.toISOString(),
    voting_end_at: endOfDay(votingStart).toISOString(),
  }
}

// 파생 결과의 유효성·순서를 검증한다. 문제 없으면 null, 있으면 한국어 메시지.
export const validateSchedule = (t: ScheduleTimes): string | null => {
  const ss = new Date(t.submission_start_at).getTime()
  const se = new Date(t.submission_end_at).getTime()
  const vs = new Date(t.voting_start_at).getTime()
  const ve = new Date(t.voting_end_at).getTime()
  if ([ss, se, vs, ve].some(Number.isNaN)) return '일정 시각 형식이 올바르지 않아요.'
  if (ss >= se) return '제출 시작은 제출 마감보다 앞서야 해요.'
  if (se > vs) return '제출 마감은 투표 시작보다 늦을 수 없어요.'
  if (vs >= ve) return '투표 시작은 투표 마감보다 앞서야 해요.'
  return null
}
