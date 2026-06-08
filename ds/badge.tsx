import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        accent:  'bg-accent-light text-accent',
        success: 'bg-[#ECFDF5] text-success',
        warning: 'bg-[#FFFBEB] text-warning',
        muted:   'bg-[#F3F4F6] text-text-secondary',
        error:   'bg-[#FEF2F2] text-error',
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
