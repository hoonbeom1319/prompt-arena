/**
 * PRD §4.4 F-3 — 프롬프트 생성 (5회 한도)
 * PRD §4.0-A — 1인 1제출 잠금
 * PRD §4.4 F-4 — 제출 시 +5 코인
 */
import { test, expect } from '@playwright/test'
import { setupAuth, mockTable, MOCK_CHALLENGE } from './helpers/mock-supabase'

const CHALLENGE_ID = MOCK_CHALLENGE.id
const PAGE_URL = `/challenge/${CHALLENGE_ID}/generate`

function makeGeneration(n: number) {
  return {
    id: `gen-${n}`,
    prompt_text: `테스트 프롬프트 ${n}번`,
    result_text: `AI가 생성한 결과물 ${n}번입니다.`,
    attempt_number: n,
  }
}

async function setupGeneratePage(
  page: import('@playwright/test').Page,
  options: {
    existingGenerations?: ReturnType<typeof makeGeneration>[]
    hasSubmission?: boolean
  } = {}
) {
  const { existingGenerations = [], hasSubmission = false } = options

  await setupAuth(page)
  await mockTable(page, 'challenges', MOCK_CHALLENGE)
  await mockTable(page, 'generations', null, existingGenerations)
  await mockTable(
    page,
    'submissions',
    hasSubmission ? { generation_id: 'gen-1' } : null
  )
}

test.describe('Generate Page — 프롬프트 작성 및 생성', () => {
  test('PRD §4.4 F-3: 페이지 로드 — 챌린지 정보와 시도 카운터가 표시된다', async ({ page }) => {
    await setupGeneratePage(page)
    await page.goto(PAGE_URL)

    await expect(page.getByRole('heading', { name: MOCK_CHALLENGE.title })).toBeVisible()
    await expect(page.getByText(MOCK_CHALLENGE.instruction)).toBeVisible()
    await expect(page.getByText('남은 시도: 5 / 5')).toBeVisible()
  })

  test('PRD §4.4 F-3: 빈 프롬프트 → 실행하기 버튼 비활성화', async ({ page }) => {
    await setupGeneratePage(page)
    await page.goto(PAGE_URL)

    await expect(page.getByRole('button', { name: '실행하기' })).toBeDisabled()
  })

  test('PRD §4.4 F-3: 프롬프트 입력 → 실행하기 버튼 활성화', async ({ page }) => {
    await setupGeneratePage(page)
    await page.goto(PAGE_URL)

    await page.getByLabel('프롬프트 입력').fill('이것이 나의 프롬프트입니다.')
    await expect(page.getByRole('button', { name: '실행하기' })).toBeEnabled()
  })

  test('PRD §4.4 F-3: 생성 성공 → 결과 카드 표시 + 시도 횟수 감소', async ({ page }) => {
    await setupGeneratePage(page)

    await page.route('/api/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generation: makeGeneration(1),
          attemptsUsed: 1,
        }),
      })
    )

    await page.goto(PAGE_URL)
    await page.getByLabel('프롬프트 입력').fill('테스트 프롬프트 1번')
    await page.getByRole('button', { name: '실행하기' }).click()

    await expect(page.getByText('AI가 생성한 결과물 1번입니다.')).toBeVisible()
    await expect(page.getByText('남은 시도: 4 / 5')).toBeVisible()
  })

  test('PRD §4.4 F-3: 생성 후 프롬프트 입력창이 초기화된다', async ({ page }) => {
    await setupGeneratePage(page)

    await page.route('/api/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ generation: makeGeneration(1), attemptsUsed: 1 }),
      })
    )

    await page.goto(PAGE_URL)
    await page.getByLabel('프롬프트 입력').fill('생성 후 지워져야 할 텍스트')
    await page.getByRole('button', { name: '실행하기' }).click()
    await expect(page.getByText('AI가 생성한 결과물 1번입니다.')).toBeVisible()

    const textarea = page.getByLabel('프롬프트 입력')
    await expect(textarea).toHaveValue('')
  })

  test('PRD §4.0-A: 결과 카드 선택 → 제출 확인 모달이 열린다', async ({ page }) => {
    await setupGeneratePage(page, { existingGenerations: [makeGeneration(1)] })

    await page.goto(PAGE_URL)
    await expect(page.getByText('AI가 생성한 결과물 1번입니다.')).toBeVisible()

    await page.getByRole('button', { name: '이 결과로 제출하기' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말 제출할까요?')).toBeVisible()
    await expect(page.getByText('+5 🪙')).toBeVisible()
  })

  test('PRD §4.0-A: 모달에서 취소 클릭 시 모달이 닫힌다', async ({ page }) => {
    await setupGeneratePage(page, { existingGenerations: [makeGeneration(1)] })

    await page.goto(PAGE_URL)
    await page.getByRole('button', { name: '이 결과로 제출하기' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('PRD §4.4 F-4: 제출 성공 → 완료 메시지가 표시된다', async ({ page }) => {
    await setupGeneratePage(page, { existingGenerations: [makeGeneration(1)] })

    await page.route('/api/submit', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ submission: { id: 'sub-new' }, coinsAwarded: 5 }),
      })
    )

    await page.goto(PAGE_URL)
    await page.getByRole('button', { name: '이 결과로 제출하기' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '제출하기' }).click()

    await expect(page.getByRole('status')).toContainText('제출 완료')
  })

  test('PRD §4.4 F-3: 이미 제출한 경우 제출 완료 메시지가 표시되고 폼이 숨겨진다', async ({ page }) => {
    await setupGeneratePage(page, { hasSubmission: true })

    await page.goto(PAGE_URL)
    await expect(page.getByRole('status')).toContainText('제출 완료')
    await expect(page.getByRole('button', { name: '실행하기' })).not.toBeVisible()
  })

  test('PRD §4.4 F-3: 5회 소진 후 실행하기 버튼 비활성화', async ({ page }) => {
    const MAX = 5
    await setupGeneratePage(page, {
      existingGenerations: Array.from({ length: MAX }, (_, i) => makeGeneration(i + 1)),
    })

    await page.goto(PAGE_URL)
    await expect(page.getByText('남은 시도: 0 / 5')).toBeVisible()
    await expect(page.getByRole('button', { name: '실행하기' })).toBeDisabled()
  })
})
