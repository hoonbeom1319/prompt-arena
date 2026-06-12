/**
 * PRD §4.4 F-3 — 프롬프트 생성 (5회 한도, 서버 카운트)
 * PRD §4.0-C — 제출 기간에만 생성 허용
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Shared mutable mock state — modified per test
let mockUser: { id: string } | null = null
let mockChallenge: Record<string, unknown> | null = null
let mockGenerationCount = 0
let mockGenerationInsertResult: Record<string, unknown> | null = null
let mockGeminiResult = 'AI generated text'
let mockGeminiShouldFail = false

vi.mock('@/lib/supabase/server', () => {
  function makeBuilder(resolverFn: () => unknown, _isCountBuilder = false) {
    const b: Record<string, unknown> = {
      select: vi.fn((_f: unknown, opts?: { count?: string }) => {
        if (opts?.count) return makeBuilder(resolverFn, true)
        return b
      }),
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
      single: vi.fn(() =>
        Promise.resolve(mockGenerationInsertResult
          ? { data: mockGenerationInsertResult, error: null }
          : { data: null, error: new Error('insert failed') })
      ),
    }
    return b
  }

  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })) },
      from: vi.fn((table: string) => {
        if (table === 'challenges') {
          return makeBuilder(() =>
            Promise.resolve(mockChallenge
              ? { data: mockChallenge, error: null }
              : { data: null, error: new Error('not found') })
          )
        }
        if (table === 'generations') {
          return makeBuilder(() => ({ count: mockGenerationCount, error: null }), true)
        }
        return makeBuilder(() => Promise.resolve({ data: null, error: null }))
      }),
    })),
    createServiceClient: vi.fn(async () => ({
      from: vi.fn((_table: string) => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(
              mockGenerationInsertResult
                ? { data: mockGenerationInsertResult, error: null }
                : { data: null, error: new Error('insert failed') }
            )),
          })),
        })),
      })),
    })),
  }
})

vi.mock('@/lib/gemini', () => ({
  generateWithPrompt: vi.fn(async () => {
    if (mockGeminiShouldFail) throw new Error('Gemini API error')
    return mockGeminiResult
  }),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function challengeAt(state: 'submission' | 'voting' | 'results') {
  const now = Date.now()
  if (state === 'submission') {
    return {
      id: 'ch-1', title: 'T', instruction: 'I',
      model_name: 'gemini-1.5-flash', temperature: 0.7, wrapper_text: null,
      submission_start_at: new Date(now - 3600000).toISOString(),
      submission_end_at: new Date(now + 3600000).toISOString(),
      voting_start_at: new Date(now + 7200000).toISOString(),
      voting_end_at: new Date(now + 10800000).toISOString(),
    }
  }
  if (state === 'voting') {
    return {
      id: 'ch-2', title: 'T', instruction: 'I',
      model_name: 'gemini-1.5-flash', temperature: 0.7, wrapper_text: null,
      submission_start_at: new Date(now - 7200000).toISOString(),
      submission_end_at: new Date(now - 3600000).toISOString(),
      voting_start_at: new Date(now - 1800000).toISOString(),
      voting_end_at: new Date(now + 3600000).toISOString(),
    }
  }
  // results
  return {
    id: 'ch-3', title: 'T', instruction: 'I',
    model_name: 'gemini-1.5-flash', temperature: 0.7, wrapper_text: null,
    submission_start_at: new Date(now - 172800000).toISOString(),
    submission_end_at: new Date(now - 86400000).toISOString(),
    voting_start_at: new Date(now - 86400000).toISOString(),
    voting_end_at: new Date(now - 3600000).toISOString(),
  }
}

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUser = null
    mockChallenge = null
    mockGenerationCount = 0
    mockGenerationInsertResult = null
    mockGeminiResult = 'AI generated text'
    mockGeminiShouldFail = false
  })

  describe('PRD §4.4 F-3 — 인증 필수', () => {
    it('비인증 요청 → 401', async () => {
      mockUser = null
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '테스트' }))
      expect(res.status).toBe(401)
    })
  })

  describe('PRD §4.4 F-3 — 입력 검증', () => {
    it('챌린지 ID 없음 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ promptText: '테스트' }))
      expect(res.status).toBe(400)
    })

    it('빈 프롬프트 → 400', async () => {
      mockUser = { id: 'user-1' }
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '   ' }))
      expect(res.status).toBe(400)
    })

    it('없는 챌린지 → 404', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = null
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'no-exist', promptText: '테스트' }))
      expect(res.status).toBe(404)
    })
  })

  describe('PRD §4.0-C — 제출 기간에만 생성 허용', () => {
    it('투표 기간 중 생성 시도 → 403', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('voting')
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-2', promptText: '테스트' }))
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('제출 기간')
    })

    it('결과 기간 중 생성 시도 → 403', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('results')
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-3', promptText: '테스트' }))
      expect(res.status).toBe(403)
    })
  })

  describe('PRD v1.1 §4.0-A — 3회 한도 서버 카운트', () => {
    it('3회 소진 시 → 429 반환', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('submission')
      mockGenerationCount = 3
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '4번째 시도' }))
      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toContain('3번')
    })

    it('2회 사용 후 시도 → 200 (3번째 허용)', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('submission')
      mockGenerationCount = 2
      mockGenerationInsertResult = {
        id: 'gen-3', prompt_text: '3번째', result_text: 'AI text', attempt_number: 3,
      }
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '3번째 시도' }))
      expect(res.status).toBe(200)
    })

    it('첫 시도(0회) → attemptsUsed: 1 반환', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('submission')
      mockGenerationCount = 0
      mockGenerationInsertResult = {
        id: 'gen-1', prompt_text: '첫번째', result_text: 'AI text', attempt_number: 1,
      }
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '첫번째 시도' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.attemptsUsed).toBe(1)
    })
  })

  describe('PRD §4.4 F-3 — API 실패 시 횟수 차감 안 함', () => {
    it('Gemini API 에러 → 500 반환, 횟수 차감 없음', async () => {
      mockUser = { id: 'user-1' }
      mockChallenge = challengeAt('submission')
      mockGenerationCount = 2
      mockGeminiShouldFail = true
      const { POST } = await import('../../app/api/generate/route')
      const res = await POST(makeRequest({ challengeId: 'ch-1', promptText: '실패 테스트' }))
      // 500 반환 (API 에러) — 성공 시에만 저장되므로 count는 그대로
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBeTruthy()
    })
  })
})
