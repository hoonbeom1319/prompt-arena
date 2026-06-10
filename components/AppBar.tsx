'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/ds/badge'
import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/ds/badge'

interface AppBarProps {
  title: string
  showBack?: boolean
  backHref?: string
  statusLabel?: string
  statusVariant?: VariantProps<typeof badgeVariants>['variant']
  rightContent?: React.ReactNode
}

export default function AppBar({ title, showBack, backHref, statusLabel, statusVariant = 'muted', rightContent }: AppBarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else router.back()
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-card border-b border-border h-[52px] flex items-center">
      <div className="w-full max-w-[430px] mx-auto px-4 grid grid-cols-[48px_1fr_auto] items-center gap-2">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="뒤로 가기"
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-primary hover:bg-bg-base transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <h1 className="text-base font-bold text-text-primary text-center truncate">{title}</h1>

        <div className="flex items-center justify-end">
          {rightContent ?? (statusLabel && (
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          ))}
        </div>
      </div>
    </header>
  )
}
