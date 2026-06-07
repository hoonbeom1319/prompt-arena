import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Header />

      <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="container" style={{ display: 'flex', gap: '4px', padding: '8px 16px' }}>
          {[
            { href: '/admin', label: '대시보드' },
            { href: '/admin/challenges', label: '챌린지' },
            { href: '/admin/submissions', label: '제출 현황' },
            { href: '/admin/users', label: '유저 관리' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                borderRadius: '6px',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        {children}
      </main>
    </div>
  )
}
