/**
 * PRD §4.1 #9, §4.4 F-8 — 코인 적립 금액 검증
 */
import { describe, it, expect } from 'vitest'
import { COIN_AMOUNTS } from '../lib/coins'

describe('PRD §4.4 F-8 — 코인 보상 금액', () => {
  it('프롬프트 제출 → +5 코인', () => {
    expect(COIN_AMOUNTS.SUBMIT_PROMPT).toBe(5)
  })

  it('투표 1회 → +1 코인', () => {
    expect(COIN_AMOUNTS.CAST_VOTE).toBe(1)
  })

  it('1등 보상 → +100 코인', () => {
    expect(COIN_AMOUNTS.RANK_1).toBe(100)
  })

  it('2등 보상 → +50 코인', () => {
    expect(COIN_AMOUNTS.RANK_2).toBe(50)
  })

  it('3등 보상 → +25 코인', () => {
    expect(COIN_AMOUNTS.RANK_3).toBe(25)
  })

  it('우승 보상이 일반 활동 보상보다 크다 (동기부여)', () => {
    expect(COIN_AMOUNTS.RANK_1).toBeGreaterThan(COIN_AMOUNTS.SUBMIT_PROMPT)
    expect(COIN_AMOUNTS.RANK_1).toBeGreaterThan(COIN_AMOUNTS.CAST_VOTE)
  })

  it('순위가 높을수록 보상이 크다', () => {
    expect(COIN_AMOUNTS.RANK_1).toBeGreaterThan(COIN_AMOUNTS.RANK_2)
    expect(COIN_AMOUNTS.RANK_2).toBeGreaterThan(COIN_AMOUNTS.RANK_3)
  })

  it('MVP는 적립(+)만 있다 — 사용(-)은 Phase 2', () => {
    const amounts = Object.values(COIN_AMOUNTS)
    expect(amounts.every(v => v > 0)).toBe(true)
  })
})
