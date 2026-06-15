/**
 * TO-DO 검증 (2026-06-15)
 * - #1 프롬프트 보이기: 제출 기간 생성 화면에서 "내가 보낸 프롬프트"가 결과물과 함께 노출
 * - #4 제출 횟수 문구: 5회 잔재 제거 — 잠금 시 "생성 잠금 (3/3)" / "3/3" 표기
 *
 * 결과 페이지 게이팅(#3)·제출 속도(#2)는 서버 컴포넌트/서버 라우트라
 * 실DB 없이 브라우저 e2e로 검증 불가 — 단위 테스트(vitest)로 커버한다.
 */
import { test, expect } from '@playwright/test'
import { setupAuth, mockTable, MOCK_CHALLENGE } from './helpers/mock-supabase'
import { MAX_GENERATIONS } from '../lib/constants'

const PAGE_URL = `/challenge/${MOCK_CHALLENGE.id}/generate`

const makeGeneration = (n: number) => ({
  id: `gen-${n}`,
  prompt_text: `내가 작성한 프롬프트 ${n}번`,
  result_text: `Gemini 결과물 ${n}번`,
  attempt_number: n,
})

test.describe('생성 화면 — TO-DO 변경 검증', () => {
  test('#1 활성 결과물 카드에 "내가 보낸 프롬프트"와 프롬프트 본문이 노출된다', async ({ page }) => {
    await setupAuth(page)
    await mockTable(page, 'challenges', MOCK_CHALLENGE)
    // attempt_number 내림차순 → 최신(3번)이 활성
    await mockTable(page, 'generations', null, [makeGeneration(3), makeGeneration(2), makeGeneration(1)])
    await mockTable(page, 'submissions', null)

    await page.goto(PAGE_URL)

    await expect(page.getByText('내가 보낸 프롬프트')).toBeVisible()
    await expect(page.getByText('내가 작성한 프롬프트 3번')).toBeVisible()
    // 본문 결과 카드 — 시도 칩의 미리보기("…" 말줄임)와 구분되도록 정확히 일치
    await expect(page.getByText('Gemini 결과물 3번', { exact: true })).toBeVisible()
  })

  test(`#4 ${MAX_GENERATIONS}회 소진 시 "생성 잠금 (${MAX_GENERATIONS}/${MAX_GENERATIONS})"·"${MAX_GENERATIONS}/${MAX_GENERATIONS}"로 표기되고 5회 잔재가 없다`, async ({ page }) => {
    await setupAuth(page)
    await mockTable(page, 'challenges', MOCK_CHALLENGE)
    await mockTable(
      page,
      'generations',
      null,
      Array.from({ length: MAX_GENERATIONS }, (_, i) => makeGeneration(MAX_GENERATIONS - i)),
    )
    await mockTable(page, 'submissions', null)

    await page.goto(PAGE_URL)

    await expect(
      page.getByRole('button', { name: `생성 잠금 (${MAX_GENERATIONS}/${MAX_GENERATIONS})` }),
    ).toBeVisible()
    await expect(page.getByText(`${MAX_GENERATIONS}/${MAX_GENERATIONS}`, { exact: true })).toBeVisible()

    // 5회 잔재 문구가 화면에 없어야 한다
    await expect(page.getByText('5/5')).toHaveCount(0)
    await expect(page.getByText('5회를 모두 사용해', { exact: false })).toHaveCount(0)
  })
})
