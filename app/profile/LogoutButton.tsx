'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { IconLogout } from '@/ds/icons'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-base hover:text-text-primary transition-colors"
      aria-label="로그아웃"
    >
      <IconLogout />
    </button>
  )
}
