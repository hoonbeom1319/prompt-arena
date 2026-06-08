'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ds/button'
import { Input } from '@/ds/input'
import { Label } from '@/ds/label'
import { Card, CardContent } from '@/ds/card'

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
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="no-underline inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-[10px] flex items-center justify-center text-lg font-bold text-white">
              P
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">
              프롬프트 아레나
            </span>
          </Link>
          <p className="mt-2 text-sm text-text-secondary">AI 프롬프트 대회에 참여하세요</p>
        </div>

        <Card>
          <CardContent className="p-7">
            {/* 모드 토글 */}
            <div className="flex bg-bg-base rounded-lg p-1 mb-6" role="tablist">
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
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

            {error && (
              <div role="alert" className="px-3.5 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-error text-sm mb-4">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="px-3.5 py-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-success text-sm mb-4">
                {success}
              </div>
            )}

            {/* 구글 로그인 */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mb-5"
              aria-label="Google 계정으로 로그인"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </Button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">또는 이메일로</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
              {mode === 'signup' && (
                <div>
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
              <div>
                <Label htmlFor="email">이메일</Label>
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
              <div>
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
                className="w-full mt-1 py-3 text-[15px]"
              >
                {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-4 text-[13px] text-text-muted">
          <Link href="/" className="text-text-secondary no-underline hover:text-text-primary transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
