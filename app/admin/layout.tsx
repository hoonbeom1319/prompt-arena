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
    <div className="min-h-screen bg-bg-base">
      <Header />

      <nav className="border-b border-border bg-bg-card" aria-label="관리자 메뉴">
        <div className="container flex gap-1 px-4 py-2">
          {[
            { href: '/admin', label: '대시보드' },
            { href: '/admin/challenges', label: '챌린지' },
            { href: '/admin/submissions', label: '제출 현황' },
            { href: '/admin/users', label: '유저 관리' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3.5 py-1.5 text-[13px] font-medium text-text-secondary no-underline rounded-md hover:text-text-primary hover:bg-bg-base transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="container pt-8 pb-16">
        {children}
      </main>
    </div>
  )
}
