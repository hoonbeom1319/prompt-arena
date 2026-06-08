/**
 * PRD §4.4 F-7 — 미인증 사용자: 보호된 페이지 접근 시 로그인 페이지로 리디렉션
 */
import { test, expect } from '@playwright/test'
import { setupUnauthenticated } from './helpers/mock-supabase'

const CHALLENGE_ID = 'challenge-e2e-test'

test.describe('Auth Gates — 미인증 리디렉션', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticated(page)
  })

  test('generate 페이지 → /auth/login 리디렉션', async ({ page }) => {
    await page.goto(`/challenge/${CHALLENGE_ID}/generate`)
    await page.waitForURL('**/auth/login', { timeout: 10000 })
    expect(page.url()).toContain('/auth/login')
  })

  test('vote 페이지 → /auth/login 리디렉션', async ({ page }) => {
    await page.goto(`/challenge/${CHALLENGE_ID}/vote`)
    await page.waitForURL('**/auth/login', { timeout: 10000 })
    expect(page.url()).toContain('/auth/login')
  })

  test('profile 페이지 → /auth/login 리디렉션', async ({ page }) => {
    // Profile is server-rendered; Next.js redirect() is followed automatically
    await page.goto('/profile')
    await page.waitForURL('**/auth/login', { timeout: 10000 })
    expect(page.url()).toContain('/auth/login')
  })
})
