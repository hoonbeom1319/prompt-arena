'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <path
      d="M3.5 9.5L10.5 3.5L17.5 9.5V18.5H13.5V13.5H7.5V18.5H3.5V9.5Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ClockIcon = ({ filled }: { filled: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="7.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10.5 7V10.5L13 12.5" stroke={filled ? 'currentColor' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PersonIcon = ({ filled }: { filled: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <circle cx="10.5" cy="7.5" r="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4.5 19C4.5 15.134 7.134 12 10.5 12C13.866 12 16.5 15.134 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const tabs = [
  {
    href: '/',
    label: '아레나',
    Icon: HomeIcon,
    isActive: (p: string) => p === '/',
  },
  {
    href: '/archive',
    label: '지난 챌린지',
    Icon: ClockIcon,
    isActive: (p: string) => p.startsWith('/archive'),
  },
  {
    href: '/profile',
    label: '내 프로필',
    Icon: PersonIcon,
    isActive: (p: string) => p.startsWith('/profile'),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-bg-card border-t border-border z-40"
      aria-label="탭 네비게이션"
    >
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map(({ href, label, Icon, isActive }) => {
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
