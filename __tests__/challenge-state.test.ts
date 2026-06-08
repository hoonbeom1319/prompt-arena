/**
 * PRD §4.0-C, §4.4, §6.3
 * 챌린지 상태는 저장값이 아니라 4개 시각으로 계산한다.
 */
import { describe, it, expect } from 'vitest'
import { getChallengeState, getNextTransition } from '../lib/challenge-state'

function makeChallenge(overrides: {
  submission_start_at?: string
  submission_end_at?: string
  voting_start_at?: string
  voting_end_at?: string
} = {}) {
  return {
    id: 'test-id',
    title: '테스트 챌린지',
    instruction: '지시문',
    category_id: null,
    challenge_type: 'solo',
    model_name: 'gemini-1.5-flash',
    temperature: 0.7,
    wrapper_text: null,
    created_by: 'admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    submission_start_at: overrides.submission_start_at ?? '2026-06-09T00:00:00Z',
    submission_end_at: overrides.submission_end_at ?? '2026-06-09T23:59:59Z',
    voting_start_at: overrides.voting_start_at ?? '2026-06-10T00:00:00Z',
    voting_end_at: overrides.voting_end_at ?? '2026-06-10T23:59:59Z',
  }
}

describe('PRD §4.0-C — 순차 진행(페이즈 모델)', () => {
  describe('제출 기간', () => {
    it('제출 시작 시각 이후 → submission 반환', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-09T12:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('submission')
    })

    it('제출 시작 정각 → submission 반환 (경계)', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-09T00:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('submission')
    })

    it('제출 마감 정각 → submission 반환 (경계)', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-09T23:59:59Z')
      expect(getChallengeState(challenge, now)).toBe('submission')
    })
  })

  describe('투표 기간', () => {
    it('투표 시작 이후 → voting 반환', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-10T12:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('voting')
    })

    it('투표 시작 정각 → voting 반환 (경계)', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-10T00:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('voting')
    })

    it('투표 마감 정각 → voting 반환 (경계)', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-10T23:59:59Z')
      expect(getChallengeState(challenge, now)).toBe('voting')
    })
  })

  describe('결과 기간', () => {
    it('투표 마감 이후 → results 반환', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-11T00:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('results')
    })

    it('오래된 챌린지 → results 반환', () => {
      const challenge = makeChallenge()
      const now = new Date('2030-01-01T00:00:00Z')
      expect(getChallengeState(challenge, now)).toBe('results')
    })
  })

  describe('대기 상태 (idle)', () => {
    it('제출 시작 전 → idle 반환', () => {
      const challenge = makeChallenge()
      const now = new Date('2026-06-08T23:59:00Z')
      expect(getChallengeState(challenge, now)).toBe('idle')
    })

    it('제출 마감 후 ~ 투표 시작 전 (갭 있는 경우) → idle 반환', () => {
      const challenge = makeChallenge({
        submission_end_at: '2026-06-09T23:59:59Z',
        voting_start_at: '2026-06-10T06:00:00Z',  // 6시간 갭
      })
      const now = new Date('2026-06-10T02:00:00Z')  // 갭 안에 있음
      expect(getChallengeState(challenge, now)).toBe('idle')
    })
  })

  describe('PRD §6.3 — 제출·투표 기간은 시간으로 분리됨 (겹치지 않음)', () => {
    it('정상 설정 챌린지에서 submission/voting/results/idle은 항상 하나만 반환', () => {
      const challenge = makeChallenge()
      const states = [
        getChallengeState(challenge, new Date('2026-06-08T00:00:00Z')),
        getChallengeState(challenge, new Date('2026-06-09T12:00:00Z')),
        getChallengeState(challenge, new Date('2026-06-10T12:00:00Z')),
        getChallengeState(challenge, new Date('2026-06-11T12:00:00Z')),
      ]
      expect(states).toEqual(['idle', 'submission', 'voting', 'results'])
    })
  })
})

describe('getNextTransition', () => {
  it('제출 기간 → 제출 마감 시각 반환', () => {
    const challenge = makeChallenge()
    const now = new Date('2026-06-09T12:00:00Z')
    const next = getNextTransition(challenge, now)
    expect(next?.label).toBe('제출 마감')
    expect(next?.time.toISOString()).toBe(new Date('2026-06-09T23:59:59Z').toISOString())
  })

  it('투표 기간 → 투표 마감 시각 반환', () => {
    const challenge = makeChallenge()
    const now = new Date('2026-06-10T12:00:00Z')
    const next = getNextTransition(challenge, now)
    expect(next?.label).toBe('투표 마감')
    expect(next?.time.toISOString()).toBe(new Date('2026-06-10T23:59:59Z').toISOString())
  })

  it('결과 기간 → null 반환', () => {
    const challenge = makeChallenge()
    const now = new Date('2026-06-11T00:00:00Z')
    expect(getNextTransition(challenge, now)).toBeNull()
  })

  it('대기 중(제출 시작 전) → 제출 시작 시각 반환', () => {
    const challenge = makeChallenge()
    const now = new Date('2026-06-08T00:00:00Z')
    const next = getNextTransition(challenge, now)
    expect(next?.label).toBe('제출 시작')
  })
})
