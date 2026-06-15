// 챌린지 일정 공용 유틸 — 생성/수정 API가 함께 쓴다.
// 기조: 운영자는 *제출일 하나*만 정하고, 나머지(제출 마감·투표 시작/마감)는
// 2일 주기로 자동 파생한다 (PRD v1.2). 저장은 항상 ISO(UTC).
//
// ⚠️ 제출일은 *KST 달력 기준*이다. 자정(00:00 KST) = 전날 15:00 UTC.
// 서버 런타임 타임존(Vercel/Node는 보통 UTC)에 의존하면 안 되므로,
// 시각을 만들 때 항상 +09:00 오프셋을 명시해 KST에 고정한다.

// 서비스 기준 타임존 오프셋 (KST, 고정)
const KST_OFFSET = '+09:00'

export interface ScheduleTimes {
  submission_start_at: string
  submission_end_at: string
  voting_start_at: string
  voting_end_at: string
}

const pad = (n: number) => String(n).padStart(2, '0')

// "YYYY-MM-DD" → 다음 날 "YYYY-MM-DD" (달력 산술, 타임존 무관).
// 정오(UTC) 앵커를 써서 오프셋 경계에서도 날짜가 밀리지 않게 한다.
const nextCalendarDay = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// 제출일(YYYY-MM-DD, KST 달력) 하나로 2일 주기 4시각을 파생한다.
// 1일차 제출 종일 / 2일차 투표 종일 → 투표 마감(자정 KST) 직후 결과 자동.
export const deriveTwoDayISO = (submissionDate: string): ScheduleTimes => {
  const votingDate = nextCalendarDay(submissionDate)
  // 각 시각을 KST(+09:00)로 못박은 뒤 UTC ISO로 저장한다.
  const kstISO = (date: string, time: string) =>
    new Date(`${date}T${time}${KST_OFFSET}`).toISOString()
  return {
    submission_start_at: kstISO(submissionDate, '00:00:00'),
    submission_end_at: kstISO(submissionDate, '23:59:59'),
    voting_start_at: kstISO(votingDate, '00:00:00'),
    voting_end_at: kstISO(votingDate, '23:59:59'),
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
