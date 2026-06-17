// KST(한국 표준시, UTC+9) 달력 경계 단일 헬퍼.
//
// 서비스의 "하루"는 서버 런타임 타임존과 무관하게 항상 KST 자정~자정이다.
// (Vercel/Node 런타임은 보통 UTC) → 날짜·자정 경계 산술은 이 파일에서만 한다.
// 자정(00:00 KST) = 전날 15:00 UTC.

// 서비스 기준 타임존 오프셋 (KST, 고정).
export const KST_OFFSET = '+09:00'

// 현재 시각을 KST 달력의 'YYYY-MM-DD'로. (런타임 타임존 무관하게 +9h 고정)
export const kstToday = (): string => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

const pad = (n: number) => String(n).padStart(2, '0')

// "YYYY-MM-DD" → 다음 날 "YYYY-MM-DD" (달력 산술, 타임존 무관).
// 정오(UTC) 앵커를 써서 오프셋 경계에서도 날짜가 밀리지 않게 한다.
export const nextCalendarDay = (date: string): string => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// KST 달력 날짜('YYYY-MM-DD') + 시각('HH:MM:SS')을 UTC ISO 문자열로 못박는다.
export const kstISO = (date: string, time: string): string =>
  new Date(`${date}T${time}${KST_OFFSET}`).toISOString()

// ISO(UTC) → KST 달력 날짜 'YYYY-MM-DD'. 저장이 KST 자정 기준(deriveTwoDayISO)이라
// 표시도 KST로 못박아야 제출일이 그대로 왕복된다. timeZone 없이 toLocaleDateString을 쓰면
// 서버 런타임(UTC)에서 하루 밀려 표기된다. sv-SE 로케일은 'YYYY-MM-DD HH:mm:ss' 포맷.
export const isoToKstDate = (iso: string): string =>
  new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10)
