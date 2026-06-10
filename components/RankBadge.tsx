import { cn } from '@/lib/utils'

interface RankBadgeProps {
  rank: number
  className?: string
}

export default function RankBadge({ rank, className }: RankBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-full text-[13px] font-extrabold tabular-nums',
        rank === 1 && 'bg-[oklch(90%_0.12_90)] text-[oklch(45%_0.12_80)]',
        rank === 2 && 'bg-[oklch(92%_0.01_256)] text-text-secondary',
        rank === 3 && 'bg-[oklch(89%_0.06_50)] text-[oklch(45%_0.1_50)]',
        rank > 3 && 'bg-bg-base text-text-muted',
        className,
      )}
    >
      {rank}
    </span>
  )
}
