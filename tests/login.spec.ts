/**
 * PRD §4.0-F — 로그인 페이지 UI
 * PRD §4.4 F-7 — 미인증 사용자 로그인 게이트
 */
import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('로그인/회원가입 탭이 표시된다', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '로그인' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '회원가입' })).toBeVisible()
  })

  test('초기 상태: 로그인 탭 선택됨', async ({ page }) => {
    const loginTab = page.getByRole('tab', { name: '로그인' })
    await expect(loginTab).toHaveAttribute('aria-selected', 'true')
  })

  test('이메일/비밀번호 필드가 표시된다', async ({ page }) => {
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
  })

  test('Google 로그인 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
  })

  test('회원가입 탭 클릭 시 닉네임 필드가 나타난다', async ({ page }) => {
    await page.getByRole('tab', { name: '회원가입' }).click()

    await expect(page.getByRole('tab', { name: '회원가입' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByLabel('닉네임')).toBeVisible()
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
  })

  test('로그인 탭으로 돌아오면 닉네임 필드가 사라진다', async ({ page }) => {
    await page.getByRole('tab', { name: '회원가입' }).click()
    await page.getByRole('tab', { name: '로그인' }).click()

    await expect(page.getByLabel('닉네임')).not.toBeVisible()
  })

  test('홈으로 돌아가기 링크가 표시된다', async ({ page }) => {
    await expect(page.getByRole('link', { name: /홈/ })).toBeVisible()
  })
})
