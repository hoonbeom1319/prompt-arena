'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

interface CountdownTimerProps {
  targetTime: string
  label: string
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

export default function CountdownTimer({ targetTime, label, onExpired }: CountdownTimerProps) {
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '500',
      }}>
        {label}
      </span>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <TimeUnit value={pad(hours)} />
        <span style={{ color: isUrgent ? 'var(--error)' : 'var(--text-primary)', fontWeight: '700', fontSize: '20px' }}>:</span>
        <TimeUnit value={pad(minutes)} urgent={isUrgent} />
        <span style={{ color: isUrgent ? 'var(--error)' : 'var(--text-primary)', fontWeight: '700', fontSize: '20px' }}>:</span>
        <TimeUnit value={pad(seconds)} urgent={isUrgent} />
      </div>
    </div>
  )
}

function TimeUnit({ value, urgent }: { value: string; urgent?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <span style={{
        fontSize: '24px',
        fontWeight: '700',
        color: urgent ? 'var(--error)' : 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
    </div>
  )
}
