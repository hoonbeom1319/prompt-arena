import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full text-[11.5px] font-semibold border',
  {
    variants: {
      variant: {
        accent:  'bg-accent-light text-accent border-accent-mid',
        success: 'bg-[color-mix(in_oklab,var(--success)_12%,white)] text-success border-[color-mix(in_oklab,var(--success)_32%,white)]',
        warning: 'bg-[color-mix(in_oklab,var(--warning)_12%,white)] text-[oklch(55%_0.13_70)] border-[color-mix(in_oklab,var(--warning)_32%,white)]',
        error:   'bg-[color-mix(in_oklab,var(--error)_12%,white)] text-error border-[color-mix(in_oklab,var(--error)_32%,white)]',
        muted:   'bg-bg-base text-text-secondary border-border',
        outline: 'bg-transparent text-text-muted border-border',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
