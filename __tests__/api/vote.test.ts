/**
 * PRD §4.0-D, §4.4 F-5 — 투표
 * PRD §4.4 F-8 — 투표 시 +1 코인
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let mockUser: { id: string } | null = null
let mockChallenge: Record<string, unknown> | null = null
let mockVoteCount = 0
let mockExistingVote: { id: string } | null = null
let mockVoteInsertResult: Record<string, unknown> | null = null
const mockAwardCoins = vi.fn()

vi.mock('@/lib/supabase/server', () => {
  function makeClientBuilder(resolverFn: () => unknown) {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      single: vi.fn(() => resolverFn()),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(resolverFn()).then(res, rej),
    }
    return b
  }

  function makeVoteCountBuilder() {
    const inner: Record<string, unknown> = {
      eq: vi.fn(() => inner),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve({ count: mockVoteCount, error: null }).then(res, rej),
    }
    const outer: Record<string, unknown> = {
      select: vi.fn((_f: unknown, opts?: { count?: string }) => {
        if (opts?.count) return inner
        // Plain select (for existing vote check)
        return makeExistingVoteBuilder()
      }),
      eq: vi.fn(() => outer),
      insert: vi.fn(() => makeInsertBuilder()),
    }
    return outer
  }

  function makeExistingVoteBuilder() {
    const b: Record<string, unknown> = {
      eq: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve(
        mockExistingVote
          ? { data: mockExistingVote, error: null }
          : { data: null, error: { code: 'PGRST116' } }
      )),
    }
    return b
  }

  function makeInsertBuilder() {
    const b: Record<string, unknown> = {
      select: vi.fn(() => b),
      single: vi.fn(() => Promise.resolve(
        mockVoteInsertResult
          ? { data: mockVoteInsertResult, error: null }
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
          return makeClientBuilder(() => Promise.resolve(
            mockChallenge ? { data: mockChallenge, error: null } : { data: null, error: null }
          ))
        }
        return makeClientBuilder(() => Promise.resolve({ data: null, error: null }))
      }),
    })),
    createServiceClient: vi.fn(async () => ({
      from: vi.fn((_table: string) => makeVoteCountBuilder()),
    })),
  }
})

vi.mock('@/lib/coin', () => ({
  awardCoins: (...args: unknown[]) => mockAwardCoins(...args),
  COIN_AMOUNTS: { CAST_VOTE: 1, SUBMIT_PROMPT: 5, RANK_1: 100, RANK_2: 50, RANK_3: 25 },
  COIN_REASONS: { SUBMIT_PROMPT: '프롬프트 제출', CAST_VOTE: '투표 참여', QUIZ_CORRECT: '퀴즈 정답', STREAK_RECOVERY: '연승 회복', RANK_1: '1등 보상', RANK_2: '2등 보상', RANK_3: '3등 보상' },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

function challengeInSubmission() {
  const now = Date.now()
  return {
    id: 'ch-1',
    submission_start_at: new Date(now - 3600000).toISOString(),
    submission_end_at: new Date(now + 3600000).toISOString(),
    voting_start_at: new Date(now + 7200000).toISOString(),
    voting_end_at: new Date(now + 10800000).toISOString(),
  }
}

describe('POST /api/vote', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUser = null
    mockChallenge = null
    mockVoteCount = 0
    mockExistingVote = null
    mockVoteInsertResult = null
    mockAwardCoins.mockResolvedValue(undefined)
  })

  describe('PRD §4.4 F-5 — 인증 필수', () => {
    it('비인증 요청 → 401', async () => {
      mockUser = null
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-1' }))
      expect(res.status).toBe(401)
    })
  })

  describe('입력 검증', () => {
    it('챌린지 ID 없음 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ submissionId: 'sub-1' }))
      expect(res.status).toBe(400)
    })

    it('제출 ID 없음 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1' }))
      expect(res.status).toBe(400)
    })
  })

  describe('PRD §4.0-C — 투표 기간에만 투표 허용', () => {
    it('제출 기간 중 투표 시도 → 403', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInSubmission()
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-1' }))
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('투표 기간')
    })
  })

  describe('PRD §4.0-F — 챌린지당 최대 3표', () => {
    it('3표 이미 사용 → 429 반환', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 3
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-new' }))
      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toContain('3표')
    })

    it('2표 사용 후 투표 → 200 (3번째 허용)', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 2
      mockExistingVote = null
      mockVoteInsertResult = { id: 'vote-3' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-3' }))
      expect(res.status).toBe(200)
    })
  })

  describe('PRD §4.0-F — 동일 제출물 중복 투표 불가', () => {
    it('이미 투표한 제출물에 재투표 → 409', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 1
      mockExistingVote = { id: 'vote-1' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-1' }))
      expect(res.status).toBe(409)
    })
  })

  describe('PRD §4.4 F-5 — 3표 완료 시 프롬프트 열람 해제', () => {
    it('3번째 투표 완료 → revealed: true', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 2
      mockExistingVote = null
      mockVoteInsertResult = { id: 'vote-3' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-3' }))
      const body = await res.json()
      expect(body.revealed).toBe(true)
    })

    it('1번째 투표 → revealed: false', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 0
      mockExistingVote = null
      mockVoteInsertResult = { id: 'vote-1' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-1' }))
      const body = await res.json()
      expect(body.revealed).toBe(false)
    })
  })

  describe('PRD §4.4 F-8 — 투표 시 +1 코인', () => {
    it('투표 성공 시 awardCoins(CAST_VOTE=1) 호출', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 0
      mockExistingVote = null
      mockVoteInsertResult = { id: 'vote-1' }
      const { POST } = await import('../../app/api/vote/route')
      await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-1' }))
      expect(mockAwardCoins).toHaveBeenCalledWith(
        expect.anything(), 'user-1', 1, '투표 참여', 'ch-1'
      )
    })

    it('응답에 votesUsed 포함', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeInVoting()
      mockVoteCount = 1
      mockExistingVote = null
      mockVoteInsertResult = { id: 'vote-2' }
      const { POST } = await import('../../app/api/vote/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', submissionId: 'sub-2' }))
      const body = await res.json()
      expect(body.votesUsed).toBe(2)
    })
  })
})
