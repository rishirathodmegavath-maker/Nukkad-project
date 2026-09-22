import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'brand' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    'bg-surface-sunken text-fg-secondary border border-border/80',
  // The product's purple accent, built from theme tokens so it holds in both themes.
  primary:
    'bg-brand-500/10 text-fg-brand border border-brand-500/20',
  brand:
    'bg-surface-sunken text-fg font-medium border border-border-strong',
  accent:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  danger:
    'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
  info:
    'bg-surface-sunken text-fg-secondary border border-border/80',
  purple:
    'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20',
}

interface BadgeProps {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'neutral', size = 'sm', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium leading-none whitespace-nowrap transition-colors max-w-full min-w-0',
        size === 'sm' ? 'gap-1.5 px-2 py-0.5 text-xs' : 'gap-1.5 px-2.5 py-1 text-xs',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current shrink-0 opacity-80" />}
      <span className="truncate min-w-0">{children}</span>
    </span>
  )
}

