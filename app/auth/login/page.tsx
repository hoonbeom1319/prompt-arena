'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ds/button'
import { Input } from '@/ds/input'
import { Label } from '@/ds/label'

const LockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { nickname },
        },
      })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          nickname: nickname || `user_${data.user.id.substring(0, 6)}`,
          coin_balance: 0,
          is_admin: false,
        })
        setSuccess('이메일을 확인해주세요! 인증 링크를 보내드렸어요.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않아요.')
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* 헤더 */}
      <header className="h-[52px] flex items-center px-4 border-b border-border bg-bg-card">
        <div className="w-full max-w-[430px] md:max-w-none mx-auto grid grid-cols-[48px_1fr_48px] items-center">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-primary hover:bg-bg-base transition-colors no-underline"
            aria-label="홈으로"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-base font-bold text-text-primary text-center">로그인</h1>
          <div />
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[390px] flex flex-col gap-6">

          {/* 아이콘 + 타이틀 */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="text-accent">
              <LockIcon />
            </div>
            <h2 className="text-[20px] font-bold text-text-primary">로그인이 필요해요</h2>
          </div>

          {/* 에러 / 성공 */}
          {error && (
            <div role="alert" className="px-4 py-3 bg-[oklch(97%_0.02_25)] border border-[oklch(85%_0.08_25)] rounded-xl text-error text-sm">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="px-4 py-3 bg-[oklch(97%_0.02_145)] border border-[oklch(85%_0.08_145)] rounded-xl text-success text-sm">
              {success}
            </div>
          )}

          {/* Google 버튼 */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-[52px] flex items-center justify-center gap-3 bg-bg-card border border-border rounded-xl text-[15px] font-semibold text-text-primary hover:bg-bg-base transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3.5">
            {/* 로그인/회원가입 토글 */}
            <div className="flex bg-bg-base rounded-lg p-1" role="tablist">
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                  className={[
                    'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                    mode === m
                      ? 'bg-bg-card text-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'bg-transparent text-text-secondary',
                  ].join(' ')}
                >
                  {m === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="사용할 닉네임을 입력해주세요"
                  required={mode === 'signup'}
                  autoComplete="username"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일 주소</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="최소 6자"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full h-[52px] text-[15px] font-semibold mt-1"
            >
              {loading ? '처리 중…' : mode === 'login' ? '이메일로 로그인' : '이메일로 회원가입'}
            </Button>
          </form>

          {/* 하단 안내 */}
          <p className="text-center text-[12px] text-text-faint leading-relaxed">
            회원가입 시 인증 메일 확인이 필요해요
          </p>
          <p className="text-center text-[11px] text-text-faint">
            <Link href="/terms" className="underline hover:text-text-muted">이용약관</Link>
            {' · '}
            <Link href="/privacy" className="underline hover:text-text-muted">개인정보처리방침</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
