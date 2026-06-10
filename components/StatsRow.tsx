import { Card } from '@/ds/card'

interface Stat {
  value: string
  label: string
  accent?: boolean
}

interface StatsRowProps {
  stats: Stat[]
}

export default function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-2.5">
      {stats.map(stat => (
        <Card key={stat.label} className="p-3">
          <div className={[
            'text-[21px] font-extrabold tabular-nums leading-tight tracking-tight',
            stat.accent ? 'text-accent' : 'text-text-primary',
          ].join(' ')}>
            {stat.value}
          </div>
          <div className="text-[11.5px] text-text-muted mt-0.5">{stat.label}</div>
        </Card>
      ))}
    </div>
  )
}
