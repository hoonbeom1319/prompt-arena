'use client'

import { Input } from '@/ds/input'
import { Label } from '@/ds/label'
import type { ScheduleLocal } from '@/lib/challenge-schedule'

interface ScheduleFieldsProps {
  value: ScheduleLocal
  onChange: (next: ScheduleLocal) => void
}

const FIELDS: Array<{ key: keyof ScheduleLocal; label: string }> = [
  { key: 'submission_start', label: '제출 시작' },
  { key: 'submission_end', label: '제출 마감' },
  { key: 'voting_start', label: '투표 시작' },
  { key: 'voting_end', label: '투표 마감' },
]

export default function ScheduleFields({ value, onChange }: ScheduleFieldsProps) {
  const set = (key: keyof ScheduleLocal, v: string) => onChange({ ...value, [key]: v })

  return (
    <div className="grid grid-cols-2 gap-4">
      {FIELDS.map(f => (
        <div key={f.key}>
          <Label htmlFor={f.key}>{f.label} *</Label>
          <Input
            id={f.key}
            type="datetime-local"
            value={value[f.key]}
            onChange={e => set(f.key, e.target.value)}
            required
          />
        </div>
      ))}
    </div>
  )
}
