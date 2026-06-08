'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ds/button'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  nickname: string
  coin_balance: number
  is_admin: boolean
}

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('users')
          .select('nickname, coin_balance, is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('users')
          .select('nickname, coin_balance, is_admin')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => { if (data) setProfile(data) })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-accent rounded-[8px] flex items-center justify-center text-sm font-bold text-white">
            P
          </div>
          <span className="text-base font-bold text-text-primary tracking-tight">
            프롬프트 아레나
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          <Link
            href="/archive"
            className="px-3 py-1.5 text-sm text-text-secondary no-underline rounded-md hover:text-text-primary transition-colors"
          >
            아카이브
          </Link>

          {profile?.is_admin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-sm text-accent no-underline rounded-md hover:text-accent-hover transition-colors"
            >
              관리자
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="사용자 메뉴 열기"
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-base border border-border rounded-lg cursor-pointer text-sm text-text-primary hover:border-border-strong transition-colors"
              >
                <span className="text-xs" aria-hidden="true">🪙</span>
                <span className="font-semibold text-accent">{profile?.coin_balance ?? 0}</span>
                <span className="text-text-secondary">{profile?.nickname ?? '...'}</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] bg-bg-card border border-border rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] min-w-[160px] z-50 overflow-hidden"
                >
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-text-primary no-underline hover:bg-bg-base transition-colors"
                  >
                    내 프로필
                  </Link>
                  <div className="border-t border-border" role="separator" />
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2.5 text-sm text-error bg-transparent border-none cursor-pointer hover:bg-bg-base transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button asChild variant="primary" size="sm" className="px-4 py-2">
              <Link href="/auth/login">로그인</Link>
            </Button>
          )}
        </nav>
      </div>

      {/* 메뉴 닫기 오버레이 */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}
