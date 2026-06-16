// 메달 색 — 금/은/동. 전체 순위 배지(RankBadge)와 시상대(Podium)가 공유하는
// 단일 출처. 1·2·3위 외 순위는 null을 돌려주므로 호출부가 기본색으로 처리한다.

interface MedalColor {
  bg: string
  text: string
}

const MEDAL_COLORS: Record<number, MedalColor> = {
  1: { bg: 'oklch(90% 0.12 90)', text: 'oklch(45% 0.12 80)' }, // 금
  2: { bg: 'oklch(92% 0.01 256)', text: 'oklch(44.6% 0.043 257.281)' }, // 은
  3: { bg: 'oklch(89% 0.06 50)', text: 'oklch(45% 0.1 50)' }, // 동
}

export const getMedalColor = (rank: number): MedalColor | null => MEDAL_COLORS[rank] ?? null
