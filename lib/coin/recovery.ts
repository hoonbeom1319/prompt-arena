// 연승 회복 *비용*(코인 측면). 회복 실행(streak 복원)은 lib/quiz/recovery.ts에 있다.

// 연승 회복 비용 계수 N (PRD v1.4 4.7.6 — 코인 첫 사용처).
// 회복 비용 = 끊긴 직전 연승 길이 × N. 시작값 1.
// 주의: N=1이면 길게 쌓은 사람은 벌어둔 코인으로 거의 공짜 회복 → 회복 사용률이 과하면 상향.
export const STREAK_RECOVERY_COST_FACTOR = 1

export const recoveryCost = (streakLength: number) =>
  streakLength * STREAK_RECOVERY_COST_FACTOR
