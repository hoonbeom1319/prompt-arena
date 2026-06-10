import { cn } from '@/lib/utils'

interface VoteTokensProps {
  used: number
  total?: number
  className?: string
}

export default function VoteTokens({ used, total = 3, className }: VoteTokensProps) {
  return (
    <span className={cn('inline-flex gap-[5px]', className)} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[11px] h-[11px] rounded-full border-[1.5px]',
            i < used
              ? 'bg-accent border-accent'
              : 'bg-transparent border-border-strong',
          )}
        />
      ))}
    </span>
  )
}
