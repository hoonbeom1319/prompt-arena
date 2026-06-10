'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/ds/button'

export default function ResetButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/reset', { method: 'POST' })
    setLoading(false)
    setConfirm(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || '초기화 실패')
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-error font-medium">정말 초기화할까요?</span>
        <Button variant="primary" size="sm" onClick={handleReset} disabled={loading}>
          {loading ? '초기화 중...' : '확인'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirm(false)} disabled={loading}>
          취소
        </Button>
      </div>
    )
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>
      DB 초기화
    </Button>
  )
}
