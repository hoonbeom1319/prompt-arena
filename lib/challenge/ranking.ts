export interface Rankable {
  voteCount: number
  attemptNumber: number
  submittedAt: string
}

// 순위 결정 규칙 (PRD 미정의 → 합의된 규칙):
// 1. 득표수 내림차순
// 2. 동점 → 시도 횟수(attempt_number) 적은 쪽 우선
// 3. 그래도 동점 → 먼저 제출(submitted_at)한 쪽 우선
// 4. 셋 다 완전히 같으면 → 공동 순위 (예: 공동 1등이면 다음은 3등)
const isFullTie = (a: Rankable, b: Rankable) =>
  a.voteCount === b.voteCount &&
  a.attemptNumber === b.attemptNumber &&
  new Date(a.submittedAt).getTime() === new Date(b.submittedAt).getTime()

export const rankSubmissions = <T extends Rankable>(submissions: T[]): Array<T & { rank: number }> => {
  const sorted = [...submissions].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
    if (a.attemptNumber !== b.attemptNumber) return a.attemptNumber - b.attemptNumber
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  })

  const ranked: Array<T & { rank: number }> = []
  sorted.forEach((sub, i) => {
    const rank = i > 0 && isFullTie(sorted[i - 1], sub) ? ranked[i - 1].rank : i + 1
    ranked.push({ ...sub, rank })
  })
  return ranked
}
