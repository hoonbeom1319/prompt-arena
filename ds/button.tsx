import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'rounded-md',
  ],
  {
    variants: {
      variant: {
        primary:   'bg-accent text-white hover:bg-accent-hover border border-accent hover:border-accent-hover',
        accent:    'bg-accent text-white hover:bg-accent-hover border border-accent hover:border-accent-hover',
        secondary: 'border border-border bg-bg-card text-text-primary hover:bg-bg-subtle hover:border-border-strong',
        ghost:     'bg-transparent border border-transparent text-text-secondary hover:bg-bg-base hover:text-text-primary',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13.5px]',
        md: 'h-[46px] px-[18px] text-[15px]',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
