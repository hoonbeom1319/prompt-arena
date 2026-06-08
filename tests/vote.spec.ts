/**
 * PRD §4.4 F-5 — 블라인드 투표 (프롬프트 숨김)
 * PRD §4.4 F-5 — 3표 사용 시 프롬프트 공개
 * PRD §4.4 F-8 — 투표 시 +1 코인
 */
import { test, expect } from '@playwright/test'
import { setupAuth, mockTable, MOCK_CHALLENGE } from './helpers/mock-supabase'

const CHALLENGE_ID = MOCK_CHALLENGE.id
const PAGE_URL = `/challenge/${CHALLENGE_ID}/vote`

const MOCK_SUBMISSIONS_WITH_GENERATIONS = [
  {
    id: 'sub-1',
    generations: { result_text: '첫 번째 AI 응답입니다.', prompt_text: '첫 번째 프롬프트' },
  },
  {
    id: 'sub-2',
    generations: { result_text: '두 번째 AI 응답입니다.', prompt_text: '두 번째 프롬프트' },
  },
  {
    id: 'sub-3',
    generations: { result_text: '세 번째 AI 응답입니다.', prompt_text: '세 번째 프롬프트' },
  },
]

async function setupVotePage(
  page: import('@playwright/test').Page,
  options: { myVotes?: string[] } = {}
) {
  const { myVotes = [] } = options

  await setupAuth(page)
  await mockTable(page, 'challenges', MOCK_CHALLENGE)

  // Submissions with nested generations
  await page.route('**/rest/v1/submissions*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUBMISSIONS_WITH_GENERATIONS),
    })
  )

  // My votes
  await page.route('**/rest/v1/votes*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(myVotes.map((submissionId) => ({ submission_id: submissionId }))),
    })
  )
}

test.describe('Vote Page — 블라인드 투표', () => {
  test('PRD §4.4 F-5: 페이지 로드 — 챌린지 정보와 투표 카운터가 표시된다', async ({ page }) => {
    await setupVotePage(page)
    await page.goto(PAGE_URL)

    await expect(page.getByRole('heading', { name: MOCK_CHALLENGE.title })).toBeVisible()
    // 3 vote dots — all in "대기" state
    const dots = page.getByRole('group', { name: '투표 현황' }).getByLabel('투표 대기')
    await expect(dots).toHaveCount(3)
  })

  test('PRD §4.4 F-5: 투표 전 — AI 응답은 보이고 프롬프트는 숨겨진다', async ({ page }) => {
    await setupVotePage(page)
    await page.goto(PAGE_URL)

    // AI 응답은 보인다
    await expect(page.getByText('첫 번째 AI 응답입니다.')).toBeVisible()
    await expect(page.getByText('두 번째 AI 응답입니다.')).toBeVisible()

    // 프롬프트는 숨겨진다 (블라인드)
    await expect(page.getByText('첫 번째 프롬프트')).not.toBeVisible()
    await expect(page.getByText('두 번째 프롬프트')).not.toBeVisible()
  })

  test('PRD §4.4 F-5: 투표 버튼 클릭 → "투표 완료" 상태로 바뀐다', async ({ page }) => {
    await setupVotePage(page)

    await page.route('/api/vote', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vote: { id: 'vote-1', submission_id: 'sub-1' },
          coinsAwarded: 1,
          votesUsed: 1,
          revealed: false,
        }),
      })
    )

    await page.goto(PAGE_URL)
    const voteButtons = page.getByRole('button', { name: '이 답변에 투표' })
    await voteButtons.first().click()

    await expect(page.getByRole('button', { name: '투표 완료 ✓' })).toBeVisible()
  })

  test('PRD §4.4 F-5: 투표 1개 후 — 완료 도트 1개 채워진다', async ({ page }) => {
    await setupVotePage(page)

    let voteCount = 0
    await page.route('/api/vote', (route) => {
      voteCount++
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vote: { id: `vote-${voteCount}` },
          coinsAwarded: 1,
          votesUsed: voteCount,
          revealed: voteCount >= 3,
        }),
      })
    })

    await page.goto(PAGE_URL)
    await page.getByRole('button', { name: '이 답변에 투표' }).first().click()

    const voteGroup = page.getByRole('group', { name: '투표 현황' })
    await expect(voteGroup.getByLabel('투표 완료')).toHaveCount(1)
    await expect(voteGroup.getByLabel('투표 대기')).toHaveCount(2)
  })

  test('PRD §4.4 F-5: 3표 모두 사용 시 프롬프트 공개 메시지가 나타난다', async ({ page }) => {
    await setupVotePage(page)

    let voteCount = 0
    await page.route('/api/vote', (route) => {
      voteCount++
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vote: { id: `vote-${voteCount}` },
          coinsAwarded: 1,
          votesUsed: voteCount,
          revealed: voteCount >= 3,
        }),
      })
    })

    await page.goto(PAGE_URL)
    const voteButtons = page.getByRole('button', { name: '이 답변에 투표' })

    await voteButtons.nth(0).click()
    await page.waitForTimeout(300)
    await voteButtons.nth(1).click()
    await page.waitForTimeout(300)
    await voteButtons.nth(2).click()

    await expect(page.getByRole('status')).toContainText('프롬프트가 공개')
  })

  test('PRD §4.4 F-5: 3표 모두 사용 시 프롬프트가 공개된다', async ({ page }) => {
    // Pre-load page with 3 votes already cast (all revealed)
    await setupVotePage(page, {
      myVotes: ['sub-1', 'sub-2', 'sub-3'],
    })

    await page.goto(PAGE_URL)

    // 프롬프트가 보인다
    await expect(page.getByText('첫 번째 프롬프트')).toBeVisible()
    await expect(page.getByText('두 번째 프롬프트')).toBeVisible()
    await expect(page.getByText('세 번째 프롬프트')).toBeVisible()

    // 투표 버튼은 숨겨진다 (isRevealed=true이면 버튼 없음)
    await expect(page.getByRole('button', { name: '이 답변에 투표' })).toHaveCount(0)
  })

  test('PRD §4.4 F-5: 동일 제출물 중복 투표 시 에러 메시지가 표시된다', async ({ page }) => {
    await setupVotePage(page)

    let callCount = 0
    await page.route('/api/vote', (route) => {
      callCount++
      if (callCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ vote: { id: 'vote-1' }, coinsAwarded: 1, votesUsed: 1, revealed: false }),
        })
      } else {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: '이미 이 제출물에 투표했어요.' }),
        })
      }
    })

    await page.goto(PAGE_URL)
    // 중복 투표: same sub different button click sequences
    // First vote
    await page.getByRole('button', { name: '이 답변에 투표' }).first().click()
    await expect(page.getByRole('button', { name: '투표 완료 ✓' })).toBeVisible()

    // Try to vote again (simulate by calling API again via second click on different button)
    await page.getByRole('button', { name: '이 답변에 투표' }).first().click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('PRD §4.4 F-8: 투표 시 +1 코인 — API 요청이 /api/vote로 전송된다', async ({ page }) => {
    await setupVotePage(page)

    let capturedBody: Record<string, unknown> | null = null
    await page.route('/api/vote', async (route) => {
      capturedBody = route.request().postDataJSON()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ vote: { id: 'vote-1' }, coinsAwarded: 1, votesUsed: 1, revealed: false }),
      })
    })

    await page.goto(PAGE_URL)
    await page.getByRole('button', { name: '이 답변에 투표' }).first().click()

    expect(capturedBody).toMatchObject({
      challengeId: CHALLENGE_ID,
      submissionId: 'sub-1',
    })
  })
})
