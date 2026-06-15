// 챌린지 일정 4시각의 공용 유틸 — 생성/수정 폼(클라이언트)과 API(서버)가 함께 쓴다.
// 저장은 항상 ISO(UTC), 입력 UI는 datetime-local(로컬 시간) 문자열을 쓴다.

export interface ScheduleTimes {
  submission_start_at: string
  submission_end_at: string
  voting_start_at: string
  voting_end_at: string
}

// datetime-local 입력 4개를 묶은 폼 상태 (로컬 시간 "YYYY-MM-DDTHH:mm").
export interface ScheduleLocal {
  submission_start: string
  submission_end: string
  voting_start: string
  voting_end: string
}

const pad = (n: number) => String(n).padStart(2, '0')

// datetime-local 문자열(로컬 시간) → ISO(UTC)
export const localInputToISO = (local: string) => new Date(local).toISOString()

// ISO(UTC) → datetime-local 문자열(로컬 시간)
export const isoToLocalInput = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const localToISO = (s: ScheduleLocal): ScheduleTimes => ({
  submission_start_at: localInputToISO(s.submission_start),
  submission_end_at: localInputToISO(s.submission_end),
  voting_start_at: localInputToISO(s.voting_start),
  voting_end_at: localInputToISO(s.voting_end),
})

export const isoToLocal = (t: ScheduleTimes): ScheduleLocal => ({
  submission_start: isoToLocalInput(t.submission_start_at),
  submission_end: isoToLocalInput(t.submission_end_at),
  voting_start: isoToLocalInput(t.voting_start_at),
  voting_end: isoToLocalInput(t.voting_end_at),
})

// 제출일(YYYY-MM-DD) 하나로 2일 주기를 파생한다 (PRD v1.2).
// 1일차 제출 종일 / 2일차 투표 종일 → 투표 마감(자정) 직후 결과 자동.
export const deriveTwoDayLocal = (date: string): ScheduleLocal => {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + 1)
  const nextDate = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
  return {
    submission_start: `${date}T00:00`,
    submission_end: `${date}T23:59`,
    voting_start: `${nextDate}T00:00`,
    voting_end: `${nextDate}T23:59`,
  }
}

// 일정 4시각의 유효성·순서를 검증한다. 문제 없으면 null, 있으면 한국어 메시지.
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
