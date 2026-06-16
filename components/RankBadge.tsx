import { cn } from '@/lib/utils'
import { getMedalColor } from '@/lib/rank-colors'

interface RankBadgeProps {
  rank: number
  className?: string
}

export default function RankBadge({ rank, className }: RankBadgeProps) {
  const medal = getMedalColor(rank)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-full text-[13px] font-extrabold tabular-nums',
        !medal && 'bg-bg-base text-text-muted',
        className,
      )}
      style={medal ? { background: medal.bg, color: medal.text } : undefined}
    >
      {rank}
    </span>
  )
}
