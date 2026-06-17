import { cn } from '@/lib/utils'
import { MAX_GENERATIONS } from '@/lib/constants'

interface GenPipsProps {
  used: number
  total?: number
  className?: string
}

export default function GenPips({ used, total = MAX_GENERATIONS, className }: GenPipsProps) {
  return (
    <span className={cn('inline-flex gap-1', className)} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[18px] h-[5px] rounded-full',
            i < used ? 'bg-accent' : 'bg-border-strong',
          )}
        />
      ))}
    </span>
  )
}
