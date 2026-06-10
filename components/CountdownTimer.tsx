'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetTime: string
  label: string
  size?: 'md' | 'lg'
  onExpired?: () => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export default function CountdownTimer({ targetTime, label, size = 'md', onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const hydrated = useIsHydrated()

  useEffect(() => {
    const target = new Date(targetTime).getTime()

    const tick = () => {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft(0)
        onExpired?.()
      } else {
        setTimeLeft(diff)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetTime, onExpired])

  if (!hydrated) return null

  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const isUrgent = totalSeconds < 3600
  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  if (size === 'lg') {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className={cn(
          'font-extrabold tabular-nums tracking-tight leading-none',
          isUrgent ? 'text-error' : 'text-text-primary',
          'text-[38px]',
        )}>
          {display}
          <span className="text-base font-semibold text-text-muted ml-2">남음</span>
        </div>
      </div>
    )
  }

  return (
    <span className={cn('tabular-nums font-semibold', isUrgent ? 'text-error' : 'text-text-secondary')}>
      {display}
    </span>
  )
}
