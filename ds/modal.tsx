'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  onClose: () => void
  /** aria-labelledby 대상 id (제목 요소). 접근성 권장. */
  labelledBy?: string
  /** 패널 정렬: 'center'(중앙) | 'sheet'(모바일 바텀시트 → 데스크탑 중앙) */
  placement?: 'center' | 'sheet'
  /** 패널(다이얼로그 박스)에 추가할 클래스 — 패딩·최대폭 등 */
  className?: string
  /** 배경 클릭으로 닫기 (기본 true). 명시적 선택을 강제할 땐 false. */
  closeOnBackdrop?: boolean
  children: React.ReactNode
}

// 오버레이·포커스·Esc·배경클릭 닫기를 담당하는 단일 모달 프리미티브 (ARCHITECTURE §3.3).
// ad-hoc 모달 대신 이걸 쓰고 내용만 children으로 주입한다.
export default function Modal({
  onClose,
  labelledBy,
  placement = 'center',
  className,
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // 모달이 열린 동안 배경 스크롤 잠금
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex justify-center bg-black/50 p-4',
        placement === 'sheet' ? 'items-end md:items-center' : 'items-center',
      )}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-full max-w-sm bg-bg-card border border-border shadow-xl outline-none',
          placement === 'sheet'
            ? 'rounded-t-xl md:rounded-xl animate-[sheet-up_240ms_var(--ease-spring)]'
            : 'rounded-xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
