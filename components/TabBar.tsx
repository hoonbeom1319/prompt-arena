'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { IconHome, IconClock, IconQuiz, IconPerson } from '@/ds/icons'

export const navTabs = [
  {
    href: '/',
    label: '아레나',
    Icon: IconHome,
    isActive: (p: string) => p === '/',
  },
  {
    href: '/archive',
    label: '지난 챌린지',
    Icon: IconClock,
    isActive: (p: string) => p.startsWith('/archive'),
  },
  {
    href: '/quiz',
    label: '퀴즈',
    Icon: IconQuiz,
    isActive: (p: string) => p.startsWith('/quiz'),
  },
  {
    href: '/profile',
    label: '내 프로필',
    Icon: IconPerson,
    isActive: (p: string) => p.startsWith('/profile'),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-bg-card border-t border-border z-40 md:hidden"
      aria-label="탭 네비게이션"
    >
      <div className="max-w-[430px] mx-auto flex">
        {navTabs.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-[3px] py-2.5 no-underline transition-colors',
                active ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon filled={active} />
              <span className="text-[10.5px] font-semibold leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
