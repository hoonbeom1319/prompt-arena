// 결정적(시드 기반) 셔플 — 같은 시드면 항상 같은 순서.
// 투표 노출 순서 랜덤화(PRD v1.1 4.6.1)에 사용한다:
// 투표자마다 순서가 다르되(앞쪽 편향 방지), 같은 투표자는 재조회해도 순서가 흔들리지 않는다.

// FNV-1a 32비트 해시
const hashSeed = (str: string): number => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 PRNG
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const seededShuffle = <T>(items: T[], seedKey: string): T[] => {
  const rand = mulberry32(hashSeed(seedKey))
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
