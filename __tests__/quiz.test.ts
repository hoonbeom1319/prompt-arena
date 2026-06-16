/**
 * PRD §4.7 — 데일리 O/X 퀴즈 연승 규칙 검증
 *  - 하루라도 빠지면 연승 초기화 / 틀려도 초기화 (4.7.2)
 *  - "출제된 날만" 카운트 → 출제 공백은 연승을 깨지 않음 (4.7.5)
 *  - 퀴즈 누적 보상 < 챌린지 우승 보상 (고정 부등호, 4.7.3)
 */
import { describe, it, expect } from 'vitest'
import { nextStreakValue } from '../lib/quiz'
import { COIN_AMOUNTS } from '../lib/coins'

describe('PRD §4.7.2/4.7.5 — 연승 판정 (정답 시)', () => {
  it('직전 출제일에 정답이면 연속 +1', () => {
    // 어제(2026-06-15) 출제·정답, 오늘 또 정답 → 6 → 7
    expect(nextStreakValue(6, '2026-06-15', '2026-06-15')).toBe(7)
  })

  it('직전 출제일에 응답이 없으면(빠짐) 1로 초기화', () => {
    // 직전 출제일은 06-15인데 마지막 정답은 06-13 → 06-14/15 중 빠짐 → 1
    expect(nextStreakValue(9, '2026-06-13', '2026-06-15')).toBe(1)
  })

  it('직전 출제일에 틀렸으면(연승 끊김) 1로 시작', () => {
    // 틀린 날 last_correct_date는 갱신 안 되므로 직전 출제일과 불일치 → 1
    expect(nextStreakValue(0, '2026-06-13', '2026-06-15')).toBe(1)
  })

  it('첫 응답(과거 정답 기록 없음)은 1', () => {
    expect(nextStreakValue(0, null, '2026-06-15')).toBe(1)
  })

  it('출제 공백은 연승을 깨지 않는다 — 직전 "출제된" 날이 며칠 전이어도 그날 정답이면 연속', () => {
    // 06-13에 정답, 06-14·06-15는 출제 없음, 오늘(06-16) 출제. prevPublishDate=06-13
    expect(nextStreakValue(3, '2026-06-13', '2026-06-13')).toBe(4)
  })
})

describe('PRD §4.7.3 — 퀴즈 보상 설계', () => {
  it('매일 정답 보상은 소액(1코인)', () => {
    expect(COIN_AMOUNTS.QUIZ_CORRECT_DAILY).toBe(1)
  })

  it('퀴즈 매일 보상 < 챌린지 우승 보상 (양념이 본체를 못 넘는다)', () => {
    expect(COIN_AMOUNTS.QUIZ_CORRECT_DAILY).toBeLessThan(COIN_AMOUNTS.RANK_1)
  })
})
