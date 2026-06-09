'use client'

import { Button } from '@/ds/button'

export default function CopyLinkButton() {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      링크 복사
    </Button>
  )
}
