/**
 * PRD v1.1 §4.6.1 — 노출 순서 랜덤화
 * 투표자마다 순서가 다르되, 같은 투표자에겐 항상 같은 순서(재조회에도 안정).
 */
import { describe, it, expect } from 'vitest'
import { seededShuffle } from '../lib/shuffle'

const items = Array.from({ length: 20 }, (_, i) => `sub-${i}`)

describe('seededShuffle', () => {
  it('같은 시드 → 항상 같은 순서 (재조회에도 순서가 흔들리지 않음)', () => {
    const a = seededShuffle(items, 'user-1:ch-1')
    const b = seededShuffle(items, 'user-1:ch-1')
    expect(a).toEqual(b)
  })

  it('다른 시드(다른 투표자) → 다른 순서 (앞쪽 편향 방지)', () => {
    const a = seededShuffle(items, 'user-1:ch-1')
    const b = seededShuffle(items, 'user-2:ch-1')
    expect(a).not.toEqual(b)
  })

  it('원본 배열을 변경하지 않고, 요소는 전부 보존된다 (전수 노출 유지)', () => {
    const original = [...items]
    const shuffled = seededShuffle(items, 'user-1:ch-1')
    expect(items).toEqual(original)
    expect([...shuffled].sort()).toEqual([...items].sort())
  })

  it('빈 배열과 단일 요소도 안전하게 처리한다', () => {
    expect(seededShuffle([], 'seed')).toEqual([])
    expect(seededShuffle(['only'], 'seed')).toEqual(['only'])
  })
})
