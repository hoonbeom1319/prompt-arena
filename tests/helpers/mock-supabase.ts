/**
 * Supabase auth mocking helpers for Playwright E2E tests.
 *
 * @supabase/ssr 0.10.x uses document.cookie (NOT localStorage) as session storage.
 * The session must be set as a real cookie before the page loads, otherwise
 * auth-js returns null immediately without making a network request.
 *
 * Storage key format: sb-${projectRef}-auth-token
 * where projectRef = first segment of the Supabase URL hostname.
 */
import { Page } from '@playwright/test'

export const MOCK_USER = {
  id: 'test-user-id-e2e',
  email: 'e2e@test.com',
  role: 'authenticated',
  aud: 'authenticated',
  user_metadata: { nickname: 'e2e테스터' },
}

export const MOCK_CHALLENGE = {
  id: 'challenge-e2e-test',
  title: '단편 소설 챌린지',
  instruction: 'AI 모델을 활용해 200자 이내의 단편 소설을 작성해주세요.',
}

/** Derives the Supabase cookie name from NEXT_PUBLIC_SUPABASE_URL. */
function getStorageKey(): string {
  // Playwright workers run in separate processes — they don't inherit process.env
  // changes made in playwright.config.ts. Read .env.local directly here.
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    try {
      const fs = require('fs') as typeof import('fs')
      const path = require('path') as typeof import('path')
      const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
      const match = envFile.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)
      if (match) url = match[1].replace(/^["']|["']$/g, '').trim()
    } catch {
      // ignore read errors
    }
  }
  if (!url) {
    throw new Error(
      'Cannot determine Supabase storage key. Set NEXT_PUBLIC_SUPABASE_URL or provide .env.local.'
    )
  }
  const projectRef = new URL(url).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

/** Fake session compatible with @supabase/auth-js Session type. */
function makeSession(user = MOCK_USER) {
  return JSON.stringify({
    access_token: 'mock-access-token-e2e',
    expires_at: 9_999_999_999,
    expires_in: 9_999_999,
    refresh_token: 'mock-refresh-token-e2e',
    token_type: 'bearer',
    user,
  })
}

/**
 * Sets a fake Supabase session cookie and mocks auth network calls.
 * Must be called BEFORE page.goto().
 */
export async function setupAuth(page: Page, user = MOCK_USER) {
  const storageKey = getStorageKey()

  // Set the session cookie so auth-js finds a valid session in cookie storage
  await page.context().addCookies([
    {
      name: storageKey,
      value: makeSession(user),
      url: 'http://localhost:3000',
      path: '/',
      httpOnly: false,
      secure: false,
    },
  ])

  // Mock the auth network call that auth-js makes to validate the session
  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  )

  // Intercept token refresh (just in case autoRefreshToken fires)
  await page.route('**/auth/v1/token*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token-e2e',
        refresh_token: 'mock-refresh-token-e2e',
        expires_at: 9_999_999_999,
        expires_in: 9_999_999,
        token_type: 'bearer',
        user,
      }),
    })
  )
}

/**
 * Ensures no auth cookie exists so the page redirects to /auth/login.
 * Also returns 401 for any stale auth network calls.
 */
export async function setupUnauthenticated(page: Page) {
  // Make sure there are no auth cookies
  await page.context().clearCookies()

  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'JWT expired', code: '401' }),
    })
  )
}

/**
 * Mocks a Supabase table REST endpoint.
 * Detects single() vs array queries via the Accept header.
 */
export async function mockTable(
  page: Page,
  table: string,
  singleData: unknown,
  arrayData?: unknown[]
) {
  await page.route(`**/rest/v1/${table}*`, async (route) => {
    const accept = route.request().headers()['accept'] ?? ''
    if (accept.includes('vnd.pgrst.object')) {
      if (singleData === null) {
        route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST116', message: 'No rows found' }),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(singleData),
        })
      }
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(arrayData ?? (singleData ? [singleData] : [])),
      })
    }
  })
}
