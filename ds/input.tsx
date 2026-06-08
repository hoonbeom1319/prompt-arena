import { cn } from '@/lib/utils'

const inputBase = [
  'w-full px-3.5 py-2.5 text-sm rounded-lg',
  'border border-border bg-bg-card text-text-primary placeholder:text-text-muted',
  'outline-none transition-colors',
  'focus:border-accent focus:ring-[3px] focus:ring-accent/10',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

export function Input({ className, ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} className={cn(inputBase, className)} {...props} />
}

export function Textarea({ className, ref, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, 'min-h-[120px] resize-y leading-relaxed', className)}
      {...props}
    />
  )
}
