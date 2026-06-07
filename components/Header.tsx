'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('users')
          .select('nickname, coin_balance, is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
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
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header style={{
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700',
            color: 'white',
          }}>
            P
          </div>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            프롬프트 아레나
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link href="/archive" style={{
            padding: '6px 12px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            borderRadius: '6px',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            아카이브
          </Link>

          {profile?.is_admin && (
            <Link href="/admin" style={{
              padding: '6px 12px',
              fontSize: '14px',
              color: 'var(--accent)',
              textDecoration: 'none',
              borderRadius: '6px',
            }}>
              관리자
            </Link>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ fontSize: '12px' }}>🪙</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                  {profile?.coin_balance ?? 0}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {profile?.nickname ?? '...'}
                </span>
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  minWidth: '160px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-base)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    내 프로필
                  </Link>
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: 'var(--error)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-base)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="btn-primary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              로그인
            </Link>
          )}
        </nav>
      </div>

      {/* Overlay for menu close */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}
