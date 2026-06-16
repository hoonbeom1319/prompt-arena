'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Badge } from '@/ds/badge'
import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/ds/badge'
import { navTabs } from '@/components/TabBar'
import { IconChevronLeft } from '@/ds/icons'
import { cn } from '@/lib/utils'

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
  const pathname = usePathname()

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else router.back()
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-card border-b border-border h-[52px] flex items-center">
      <div className="w-full max-w-[430px] md:max-w-none mx-auto px-4 md:px-6 grid grid-cols-[48px_1fr_auto] md:flex items-center gap-2 md:relative">
        <div className={cn('flex items-center', !showBack && 'md:hidden')}>
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="뒤로 가기"
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-primary hover:bg-bg-base transition-colors"
            >
              <IconChevronLeft />
            </button>
          )}
        </div>

        <h1 className="text-base font-bold text-text-primary text-center md:text-left truncate md:shrink-0">{title}</h1>

        <nav
          className="hidden md:flex items-center gap-1 md:absolute md:left-1/2 md:-translate-x-1/2"
          aria-label="주요 메뉴"
        >
          {navTabs.map(({ href, label, isActive }) => {
            const active = isActive(pathname)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors',
                  active
                    ? 'text-accent bg-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-base',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-end min-w-[48px] md:min-w-0 md:ml-auto">
          {rightContent ?? (statusLabel && (
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          ))}
        </div>
      </div>
    </header>
  )
}
