'use client'

import { toast } from 'sonner'
import { Button } from '@/ds/button'

export default function CopyLinkButton() {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('링크가 복사되었어요')
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      링크 복사
    </Button>
  )
}
