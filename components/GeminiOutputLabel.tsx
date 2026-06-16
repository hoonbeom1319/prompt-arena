import { cn } from '@/lib/utils'

// "✦ GEMINI 결과물" 섹션 헤더 — 생성·투표·결과(우승작/전체순위) 4라우트가 공유한다.
// ✦는 UI 컨트롤이 아니라 장식 글리프(콘텐츠성)라 ds/icons가 아니라 여기서 상수화한다
// (ARCHITECTURE §3.2 — 장식 글리프 하드코딩 반복 금지 → 상수화). 여백만 className으로 조정.
export default function GeminiOutputLabel({ className }: { className?: string }) {
  return (
    <div className={cn('text-[11px] font-semibold text-accent uppercase tracking-wider', className)}>
      ✦ GEMINI 결과물
    </div>
  )
}
