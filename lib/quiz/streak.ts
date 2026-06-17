// 연승 계산 순수 함수 (PRD v1.3 4.7 — 테스트 대상).
//
// 원칙: 연승은 "출제된 날만" 카운트 → 출제 공백(비축 소진)이 사용자 연승을 깨지 않는다 (4.7.5).
// 하루라도 빠지거나(직전 출제일에 정답이 없으면) 틀리면 연승 0 (4.7.2). 하루 기준=KST 자정(lib/time).

// 정답을 맞혔을 때의 새 연승 값.
//  - prevPublishDate: 오늘 이전 '출제된' 가장 최근 날짜 (출제 공백은 건너뛴 값).
//  - lastCorrectDate: 사용자가 마지막으로 정답을 맞힌 게시일.
// 직전 출제일에 내가 정답이었으면(둘이 같으면) 연속 +1, 아니면 1로 새 시작.
// → 하루라도 빠지거나(직전 출제일에 응답 없음/오답) 끊기면 1. 출제 공백은 깨지 않음.
export const nextStreakValue = (
  prevCurrent: number,
  lastCorrectDate: string | null,
  prevPublishDate: string | null
): number => {
  const continued = !!prevPublishDate && lastCorrectDate === prevPublishDate
  return continued ? prevCurrent + 1 : 1
}
