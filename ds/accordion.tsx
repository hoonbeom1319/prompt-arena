'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IconChevronRight } from '@/ds/icons'

/**
 * 높이 애니메이션이 들어간 아코디언.
 *
 * 네이티브 <details>는 펼침 애니메이션이 불가능하므로, 프로젝트에서 검증된
 * grid-rows-[1fr]/[0fr] + transition-[grid-template-rows] 기법으로 동작한다.
 * (콘텐츠 높이를 JS로 측정할 필요 없이 CSS만으로 부드럽게 펼쳐진다.)
 *
 * 스타일 차이는 variant로 분기한다. trigger 영역의 컨텐츠는 호출부가 주입한다.
 */

type AccordionVariant = 'subtle' | 'plain'

const TRIGGER_VARIANTS: Record<AccordionVariant, string> = {
  // 테두리 박스형 — 챌린지 그룹 헤더 등 목록 항목용 (기본)
  subtle:
    'px-4 py-3 rounded-lg border border-border bg-bg-subtle hover:border-border-strong transition-colors',
  // 장식 없는 인라인형 — 본문 안에 녹아드는 펼침/접힘용
  plain: 'py-2',
}

interface AccordionProps {
  /** 헤더(클릭 영역)에 표시할 컨텐츠. 셰브론 아이콘은 컴포넌트가 자동으로 붙인다. */
  trigger: React.ReactNode
  children: React.ReactNode
  /** 초기 펼침 여부 (uncontrolled) */
  defaultOpen?: boolean
  variant?: AccordionVariant
  className?: string
  /** 펼쳐지는 콘텐츠 래퍼에 추가할 클래스 (예: 상단 여백) */
  contentClassName?: string
}

export function Accordion({
  trigger,
  children,
  defaultOpen = false,
  variant = 'subtle',
  className,
  contentClassName,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 text-left cursor-pointer select-none',
          TRIGGER_VARIANTS[variant],
        )}
      >
        <Chevron open={open} />
        {trigger}
      </button>

      {/* grid-rows 0fr→1fr 전환으로 높이를 애니메이션한다. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={cn('overflow-hidden', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <IconChevronRight
      className={cn(
        'text-text-muted shrink-0 transition-transform duration-300',
        open && 'rotate-90',
      )}
    />
  )
}
