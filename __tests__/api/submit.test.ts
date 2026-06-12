/**
 * PRD §4.0-A, §4.4 F-4 — 제출 확정 잠금 (1인 1제출)
 * PRD §4.4 F-8 — 제출 시 +5 코인
 * PRD §4.4 F-9 — first_submission, participation_10 뱃지
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let mockUser: { id: string } | null = null
let mockChallenge: Record<string, unknown> | null = null
let mockGeneration: { id: string; result_text?: string } | null = null
let mockExistingSubmission: { id: string } | null = null
let mockSubmissionInsertResult: Record<string, unknown> | null = null
let mockSubmissionCount = 0
const mockAwardCoins = vi.fn()
const mockCheckAndAwardBadge = vi.fn()
const mockScheduleSubmissionSummary = vi.fn()

vi.mock('@/lib/supabase/server', () => {
  function makeBuilder(resolverFn: () => unknown) {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => resolverFn()),
      insert: vi.fn(() => makeInsertBuilder()),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(resolverFn()).then(res, rej),
    }
    return b
  }

  function makeInsertBuilder() {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve(
        mockSubmissionInsertResult
          ? { data: mockSubmissionInsertResult, error: null }
          : { data: null, error: new Error('insert failed') }
      )),
    }
    return b
  }

  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })) },
      from: vi.fn((table: string) => {
        if (table === 'challenges') {
          return makeBuilder(() => Promise.resolve(
            mockChallenge ? { data: mockChallenge, error: null } : { data: null, error: null }
          ))
        }
        if (table === 'generations') {
          return makeBuilder(() => Promise.resolve(
            mockGeneration ? { data: mockGeneration, error: null } : { data: null, error: null }
          ))
        }
        return makeBuilder(() => Promise.resolve({ data: null, error: null }))
      }),
    })),
    createServiceClient: vi.fn(async () => {
      // Track call order: 1=check-existing, 2=insert, 3=count-submissions
      let fromCallCount = 0

      return {
        from: vi.fn((_table: string) => {
          fromCallCount++
          const callIdx = fromCallCount

          if (callIdx === 1) {
            // Check existing submission: .select().eq().eq().single()
            const b: Record<string, unknown> = {
              select: vi.fn(() => b),
              eq: vi.fn(() => b),
              single: vi.fn(() => Promise.resolve(
                mockExistingSubmission
                  ? { data: mockExistingSubmission, error: null }
                  : { data: null, error: { code: 'PGRST116' } }
              )),
            }
            return b
          }

          if (callIdx === 2) {
            // Insert submission: .insert().select().single()
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(
                    mockSubmissionInsertResult
                      ? { data: mockSubmissionInsertResult, error: null }
                      : { data: null, error: new Error('insert failed') }
                  )),
                })),
              })),
            }
          }

          // callIdx >= 3: count queries — .select('*', {count}).eq()
          return {
            select: vi.fn((_f: unknown, opts?: { count?: string }) => {
              if (opts?.count) {
                return {
                  eq: vi.fn(() => ({ count: mockSubmissionCount, error: null })),
                }
              }
              return { eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })) }
            }),
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

vi.mock('@/lib/summary', () => ({
  scheduleSubmissionSummary: (...args: unknown[]) => mockScheduleSubmissionSummary(...args),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function challengeInSubmission() {
  const now = Date.now()
  return {
    id: 'ch-1',
    title: '여행 일정 챌린지',
    instruction: '3박 4일 여행 일정을 짜는 프롬프트를 작성하세요.',
    submission_start_at: new Date(now - 3600000).toISOString(),
    submission_end_at: new Date(now + 3600000).toISOString(),
    voting_start_at: new Date(now + 7200000).toISOString(),
    voting_end_at: new Date(now + 10800000).toISOString(),
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

describe('POST /api/submit', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUser = null
    mockChallenge = null
    mockGeneration = null
    mockExistingSubmission = null
    mockSubmissionInsertResult = null
    mockSubmissionCount = 0
    mockAwardCoins.mockClear()
    mockAwardCoins.mockResolvedValue(undefined)
    mockCheckAndAwardBadge.mockClear()
    mockCheckAndAwardBadge.mockResolvedValue(undefined)
    mockScheduleSubmissionSummary.mockClear()
  })

  describe('PRD §4.4 F-4 — 인증 필수', () => {
    it('비인증 요청 → 401', async () => {
      mockUser = null
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(res.status).toBe(401)
    })
  })

  describe('입력 검증', () => {
    it('챌린지 ID 없음 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ generationId: 'gen-1' }))
      expect(res.status).toBe(400)
    })

    it('생성 ID 없음 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(400)
    })

    it('없는 챌린지 → 404', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = null
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'no-exist', generationId: 'gen-1' }))
      expect(res.status).toBe(404)
    })
  })

  describe('PRD §4.0-C — 제출 기간에만 제출 허용', () => {
    it('투표 기간 중 제출 시도 → 403', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(res.status).toBe(403)
    })
  })

  describe('PRD §4.0-A — 1인 1제출 잠금', () => {
    it('이미 제출한 경우 → 409', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1' }
      mockExistingSubmission = { id: 'existing-sub' }
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toContain('이미')
    })
  })

  describe('PRD §4.4 F-8 — 제출 시 코인 +5', () => {
    it('정상 제출 시 SUBMIT_PROMPT(5) 코인으로 awardCoins 호출', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1' }
      mockExistingSubmission = null
      mockSubmissionInsertResult = { id: 'sub-1' }
      mockSubmissionCount = 1
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(res.status).toBe(200)
      expect(mockAwardCoins).toHaveBeenCalledWith(
        expect.anything(), 'user-1', 5, '프롬프트 제출', 'ch-1'
      )
    })

    it('응답에 coinsAwarded: 5 포함', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1' }
      mockExistingSubmission = null
      mockSubmissionInsertResult = { id: 'sub-1' }
      mockSubmissionCount = 1
      const { POST } = await import('../../app/api/submit/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      const body = await res.json()
      expect(body.coinsAwarded).toBe(5)
    })
  })

  describe('PRD v1.1 §4.6.4 — 제출 확정 시 AI 중립 요약 생성 트리거', () => {
    it('정상 제출 시 scheduleSubmissionSummary가 결과물 텍스트·챌린지 주제와 함께 호출된다', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1', result_text: '생성된 결과물' }
      mockExistingSubmission = null
      mockSubmissionInsertResult = { id: 'sub-1' }
      mockSubmissionCount = 1
      const { POST } = await import('../../app/api/submit/route')
      await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(mockScheduleSubmissionSummary).toHaveBeenCalledWith(
        expect.anything(), 'sub-1', '생성된 결과물',
        { title: '여행 일정 챌린지', instruction: '3박 4일 여행 일정을 짜는 프롬프트를 작성하세요.' }
      )
    })

    it('제출 실패(이미 제출) 시 요약 생성을 트리거하지 않는다', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1', result_text: '생성된 결과물' }
      mockExistingSubmission = { id: 'existing-sub' }
      const { POST } = await import('../../app/api/submit/route')
      await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(mockScheduleSubmissionSummary).not.toHaveBeenCalled()
    })
  })

  describe('PRD §4.4 F-9 — 뱃지: first_submission', () => {
    it('첫 제출(count=1) 시 first_submission 뱃지 체크', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1' }
      mockExistingSubmission = null
      mockSubmissionInsertResult = { id: 'sub-1' }
      mockSubmissionCount = 1
      const { POST } = await import('../../app/api/submit/route')
      await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      expect(mockCheckAndAwardBadge).toHaveBeenCalledWith(
        expect.anything(), 'user-1', 'first_submission'
      )
    })

    it('두 번째 제출(count=2) 시 first_submission 뱃지 체크 안 함', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      mockGeneration = { id: 'gen-1' }
      mockExistingSubmission = null
      mockSubmissionInsertResult = { id: 'sub-2' }
      mockSubmissionCount = 2
      const { POST } = await import('../../app/api/submit/route')
      await POST(makeRequest({ challengeId: 'ch-1', generationId: 'gen-1' }))
      const badgeCalls = mockCheckAndAwardBadge.mock.calls.map((c: unknown[]) => c[2])
      expect(badgeCalls).not.toContain('first_submission')
    })
  })
})
