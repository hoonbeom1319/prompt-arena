'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/challenges', label: '챌린지 관리' },
  { href: '/admin/seed', label: '시드 제출' },
  { href: '/admin/submissions', label: '출품·결과' },
  { href: '/admin/users', label: '사용자·코인' },
]

interface AdminShellProps {
  children: React.ReactNode
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-bg-subtle">
      <div className="w-full min-h-screen flex">
        <nav
          className="w-[210px] shrink-0 border-r border-border bg-bg-card p-3 flex flex-col gap-0.5"
          aria-label="관리자 메뉴"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 mb-2 text-sm font-bold text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            운영자
          </div>

          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-[13px] font-medium no-underline rounded-md transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
              )}
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-border my-2 mx-1" />

          <Link
            href="/"
            className="px-3 py-2 text-[13px] font-medium text-text-secondary no-underline rounded-md hover:bg-bg-subtle hover:text-text-primary transition-colors"
          >
            ← 사용자 앱
          </Link>
        </nav>

        <main className="flex-1 p-6 overflow-auto bg-bg-card">
          {children}
        </main>
      </div>
    </div>
  )
}
