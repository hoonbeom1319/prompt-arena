'use client'

import CountdownTimer from './CountdownTimer'
import { Card } from '@/ds/card'

interface CountdownCardProps {
  targetTime: string
  label: string
}

export default function CountdownCard({ targetTime, label }: CountdownCardProps) {
  return (
    <Card className="p-4">
      <CountdownTimer targetTime={targetTime} label={label} size="lg" />
    </Card>
  )
}
