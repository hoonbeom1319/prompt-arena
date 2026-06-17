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

// 라우트는 코인·뱃지를 after()로 응답 후 처리한다. 테스트(요청 스코프 밖)에서는
// after가 던지게 해 라우트의 동기 폴백(await reward)을 타도록 강제 — 보상 호출을 결정적으로 검증.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: () => { throw new Error('after() outside request scope (test)') },
  }
})

vi.mock('@/lib/supabase/server', () => {
  // 종단(single/maybeSingle/await)에서 해당 mock 데이터를 돌려주는 테이블별 빌더.
  // 챌린지·생성물·중복확인 조회는 라우트에서 service client로 병렬 실행된다.
  function challengeBuilder() {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve(
        mockChallenge ? { data: mockChallenge, error: null } : { data: null, error: null }
      )),
    }
    return b
  }

  function generationBuilder() {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve(
        mockGeneration ? { data: mockGeneration, error: null } : { data: null, error: null }
      )),
    }
    return b
  }

  function submissionsBuilder() {
    let isCount = false
    const b: Record<string, unknown> = {
      select: vi.fn((_f?: unknown, opts?: { count?: string }) => {
        if (opts?.count) isCount = true
        return b
      }),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(
        mockExistingSubmission
          ? { data: mockExistingSubmission, error: null }
          : { data: null, error: null }
      )),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(
            mockSubmissionInsertResult
              ? { data: mockSubmissionInsertResult, error: null }
              : { data: null, error: new Error('insert failed') }
          )),
        })),
      })),
      // count 쿼리는 .select(..,{count}).eq()로 끝나고 그대로 await된다 — thenable로 처리
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(
          isCount ? { count: mockSubmissionCount, error: null } : { data: null, error: null }
        ).then(res, rej),
    }
    return b
  }

  const serviceFrom = vi.fn((table: string) => {
    if (table === 'challenges') return challengeBuilder()
    if (table === 'generations') return generationBuilder()
    if (table === 'submissions') return submissionsBuilder()
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(res, rej),
    }
    return b
  })

  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })) },
      from: vi.fn(() => {
        const b: Record<string, unknown> = {
          select: vi.fn(() => b),
          eq: vi.fn(() => b),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }
        return b
      }),
    })),
    createServiceClient: vi.fn(async () => ({ from: serviceFrom })),
  }
})

vi.mock('@/lib/coin', () => ({
  awardCoins: (...args: unknown[]) => mockAwardCoins(...args),
  checkAndAwardBadge: (...args: unknown[]) => mockCheckAndAwardBadge(...args),
  COIN_AMOUNTS: { SUBMIT_PROMPT: 5, CAST_VOTE: 1, RANK_1: 100, RANK_2: 50, RANK_3: 25 },
  COIN_REASONS: { SUBMIT_PROMPT: '프롬프트 제출', CAST_VOTE: '투표 참여', QUIZ_CORRECT: '퀴즈 정답', STREAK_RECOVERY: '연승 회복', RANK_1: '1등 보상', RANK_2: '2등 보상', RANK_3: '3등 보상' },
}))

vi.mock('@/lib/ai/summary', () => ({
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
