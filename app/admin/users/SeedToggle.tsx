'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SeedToggle({ userId, isSeed }: { userId: string; isSeed: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isSeed: !isSeed }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={[
        'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors',
        isSeed
          ? 'bg-accent-light border-accent text-accent hover:bg-[oklch(94%_0.05_241)]'
          : 'bg-bg-base border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
        loading ? 'opacity-50 cursor-wait' : '',
      ].join(' ')}
    >
      {isSeed ? '시드 ✓' : '시드'}
    </button>
  )
}
