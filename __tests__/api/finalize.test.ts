/**
 * PRD §4.4 F-6 — 결과 확정 (관리자 전용)
 * PRD §4.4 F-8 — 순위별 코인 지급
 * PRD §4.4 F-9 — first_win, wins_3 뱃지
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let mockUser: { id: string } | null = null
let mockProfile: { is_admin: boolean } | null = null
let mockChallenge: Record<string, unknown> | null = null
let mockSubmissions: Array<{ id: string; user_id: string; is_seed: boolean }> = []
let mockVoteCounts: Record<string, number> = {}
let mockWinCount = 0
const mockAwardCoins = vi.fn()
const mockCheckAndAwardBadge = vi.fn()

vi.mock('@/lib/supabase/server', () => {
  function makeClientBuilder(resolverFn: () => unknown) {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => resolverFn()),
    }
    return b
  }

  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })) },
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return makeClientBuilder(() => Promise.resolve(
            mockProfile ? { data: mockProfile, error: null } : { data: null, error: null }
          ))
        }
        if (table === 'challenges') {
          return makeClientBuilder(() => Promise.resolve(
            mockChallenge ? { data: mockChallenge, error: null } : { data: null, error: null }
          ))
        }
        return makeClientBuilder(() => Promise.resolve({ data: null, error: null }))
      }),
    })),
    createServiceClient: vi.fn(async () => {
      let submissionCallCount = 0

      return {
        from: vi.fn((table: string) => {
          if (table === 'submissions') {
            return {
              select: vi.fn((_f: unknown, opts?: { count?: string }) => {
                if (opts?.count) {
                  // wins count query
                  return {
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({ count: mockWinCount, error: null })),
                    })),
                  }
                }
                // 체인 공용 빌더 — 멱등성 가드(.eq().eq().not().limit())와
                // 제출 목록(.eq().eq() await)을 모두 지원한다
                const b: Record<string, unknown> = {
                  eq: vi.fn(() => b),
                  not: vi.fn(() => b),
                  // 가드 쿼리: 아직 확정 전(빈 결과)
                  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
                  then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
                    Promise.resolve({ data: mockSubmissions, error: null }).then(res, rej),
                }
                return b
              }),
              update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            }
          }

          if (table === 'votes') {
            return {
              select: vi.fn((_f: unknown, opts?: { count?: string }) => {
                if (opts?.count) {
                  // per-submission vote count
                  return {
                    eq: vi.fn(() => ({
                      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
                        const subId = mockSubmissions[submissionCallCount]?.id ?? 'unknown'
                        const count = mockVoteCounts[subId] ?? 0
                        submissionCallCount++
                        return Promise.resolve({ count, error: null }).then(res, rej)
                      },
                    })),
                  }
                }
                // voters list
                return {
                  eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
                }
              }),
            }
          }

          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
          }
        }),
      }
    }),
  }
})

vi.mock('@/lib/coins', () => ({
  awardCoins: (...args: unknown[]) => mockAwardCoins(...args),
  checkAndAwardBadge: (...args: unknown[]) => mockCheckAndAwardBadge(...args),
  COIN_AMOUNTS: { SUBMIT_PROMPT: 5, CAST_VOTE: 1, RANK_1: 100, RANK_2: 50, RANK_3: 25 },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function challengeInResults() {
  const now = Date.now()
  return {
    id: 'ch-1',
    submission_start_at: new Date(now - 172800000).toISOString(),
    submission_end_at: new Date(now - 86400000).toISOString(),
    voting_start_at: new Date(now - 86400000).toISOString(),
    voting_end_at: new Date(now - 3600000).toISOString(),
  }
}

function challengeInVoting() {
  const now = Date.now()
  return {
    id: 'ch-1',
    submission_start_at: new Date(now - 7200000).toISOString(),
    submission_end_at: new Date(now - 3600000).toISOString(),
    voting_start_at: new Date(now - 1800000).toISOString(),
    voting_end_at: new Date(now + 3600000).toISOString(),
  }
}

describe('POST /api/finalize', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUser = null
    mockProfile = null
    mockChallenge = null
    mockSubmissions = []
    mockVoteCounts = {}
    mockWinCount = 0
    mockAwardCoins.mockClear()
    mockAwardCoins.mockResolvedValue(undefined)
    mockCheckAndAwardBadge.mockClear()
    mockCheckAndAwardBadge.mockResolvedValue(undefined)
  })

  describe('PRD §5 A-1 — 관리자 전용', () => {
    it('비인증 요청 → 401', async () => {
      mockUser = null
      const { POST } = await import('../../app/api/finalize/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(401)
    })

    it('일반 사용자 → 403', async () => {
      mockUser = { id: 'user-1' }
      mockProfile = { is_admin: false }
      const { POST } = await import('../../app/api/finalize/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(403)
    })
  })

  describe('PRD §4.4 F-6 — 결과 기간에만 확정 허용', () => {
    it('투표 진행 중 finalize → 400', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInVoting()
      const { POST } = await import('../../app/api/finalize/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('투표')
    })
  })

  describe('PRD §4.4 F-8 — 순위별 코인 지급', () => {
    it('1등 → +100, 2등 → +50, 3등 → +25 코인 지급', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [
        { id: 'sub-1', user_id: 'user-1', is_seed: false },
        { id: 'sub-2', user_id: 'user-2', is_seed: false },
        { id: 'sub-3', user_id: 'user-3', is_seed: false },
      ]
      mockVoteCounts = { 'sub-1': 10, 'sub-2': 5, 'sub-3': 2 }
      mockWinCount = 1

      const { POST } = await import('../../app/api/finalize/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(200)

      const coinCalls = mockAwardCoins.mock.calls
      expect(coinCalls.find((c: unknown[]) => c[1] === 'user-1')?.[2]).toBe(100)
      expect(coinCalls.find((c: unknown[]) => c[1] === 'user-2')?.[2]).toBe(50)
      expect(coinCalls.find((c: unknown[]) => c[1] === 'user-3')?.[2]).toBe(25)
    })

    it('4등 이하 코인 지급 없음', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [
        { id: 'sub-1', user_id: 'user-1', is_seed: false },
        { id: 'sub-2', user_id: 'user-2', is_seed: false },
        { id: 'sub-3', user_id: 'user-3', is_seed: false },
        { id: 'sub-4', user_id: 'user-4', is_seed: false },
      ]
      mockVoteCounts = { 'sub-1': 10, 'sub-2': 5, 'sub-3': 2, 'sub-4': 0 }
      mockWinCount = 1

      const { POST } = await import('../../app/api/finalize/route')
      await POST(makeRequest({ challengeId: 'ch-1' }))

      const coinCalls = mockAwardCoins.mock.calls
      expect(coinCalls.find((c: unknown[]) => c[1] === 'user-4')).toBeUndefined()
    })
  })

  describe('PRD §4.4 F-9 — 뱃지', () => {
    it('1등 수상 시 first_win 뱃지 체크', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [{ id: 'sub-1', user_id: 'user-winner', is_seed: false }]
      mockVoteCounts = { 'sub-1': 5 }
      mockWinCount = 1

      const { POST } = await import('../../app/api/finalize/route')
      await POST(makeRequest({ challengeId: 'ch-1' }))

      expect(mockCheckAndAwardBadge).toHaveBeenCalledWith(
        expect.anything(), 'user-winner', 'first_win'
      )
    })

    it('3회 우승 달성 시 wins_3 뱃지 체크', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [{ id: 'sub-1', user_id: 'user-champ', is_seed: false }]
      mockVoteCounts = { 'sub-1': 10 }
      mockWinCount = 3

      const { POST } = await import('../../app/api/finalize/route')
      await POST(makeRequest({ challengeId: 'ch-1' }))

      expect(mockCheckAndAwardBadge).toHaveBeenCalledWith(
        expect.anything(), 'user-champ', 'wins_3'
      )
    })

    it('2회 우승 시 wins_3 뱃지 체크 안 함', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [{ id: 'sub-1', user_id: 'user-almost', is_seed: false }]
      mockVoteCounts = { 'sub-1': 8 }
      mockWinCount = 2

      const { POST } = await import('../../app/api/finalize/route')
      await POST(makeRequest({ challengeId: 'ch-1' }))

      const badgeCalls = mockCheckAndAwardBadge.mock.calls.map((c: unknown[]) => c[2])
      expect(badgeCalls).not.toContain('wins_3')
    })
  })

  describe('응답 형식', () => {
    it('성공 시 finalizedCount 포함', async () => {
      mockUser = { id: 'admin-1' }
      mockProfile = { is_admin: true }
      mockChallenge = challengeInResults()
      mockSubmissions = [
        { id: 'sub-1', user_id: 'user-1', is_seed: false },
        { id: 'sub-2', user_id: 'user-2', is_seed: false },
      ]
      mockVoteCounts = { 'sub-1': 3, 'sub-2': 1 }
      mockWinCount = 1

      const { POST } = await import('../../app/api/finalize/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.finalizedCount).toBe(2)
    })
  })
})
