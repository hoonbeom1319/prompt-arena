/**
 * PRD §4.1 #9, §4.4 F-8 — 코인 적립 금액 검증
 * PRD v1.4 §4.7.6 — 코인 첫 사용처(연승 회복) 비용 계산
 */
import { describe, it, expect } from 'vitest'
import { COIN_AMOUNTS, STREAK_RECOVERY_COST_FACTOR, recoveryCost } from '../lib/coins'

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

  it('COIN_AMOUNTS는 적립(+) 항목만 — 사용(-)은 비용 계산식(recoveryCost)으로 분리', () => {
    const amounts = Object.values(COIN_AMOUNTS)
    expect(amounts.every(v => v > 0)).toBe(true)
  })
})

describe('PRD v1.4 §4.7.6 — 연승 회복 비용 (코인 첫 사용처)', () => {
  it('회복 비용 = 끊긴 직전 연승 길이 × N (시작 N=1)', () => {
    expect(STREAK_RECOVERY_COST_FACTOR).toBe(1)
    expect(recoveryCost(43)).toBe(43)
    expect(recoveryCost(1)).toBe(1)
  })

  it('회복할 연승이 없으면(0) 비용 0', () => {
    expect(recoveryCost(0)).toBe(0)
  })

  it('연승이 길수록 회복 비용이 비싸다 (직관: 길수록 잃을 게 큼)', () => {
    expect(recoveryCost(30)).toBeGreaterThan(recoveryCost(10))
  })
})
