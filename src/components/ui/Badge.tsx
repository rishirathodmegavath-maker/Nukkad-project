import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'brand' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

// Each status tone reads from Nukkad's own semantic tokens (tokens.css) at a single value — the
// same "tint background + full-strength text, no separate dark-mode shade" idiom already used by
// Toaster.tsx, rather than each tone hand-picking its own light/dark pair from Tailwind's raw
// palette. accent/warning share one token on purpose: tokens.css defines them as the same colour
// (the Saffron/Amber accent doubles as the warning colour) — that was already true before this
// change, just via two separately-hardcoded values that happened to match.
const toneClasses: Record<BadgeTone, string> = {
  neutral:
    'bg-surface-sunken text-fg-secondary border border-border/80',
  primary:
    'bg-brand-500/10 text-fg-brand border border-brand-500/20',
  brand:
    'bg-surface-sunken text-fg font-medium border border-border-strong',
  accent:
    'bg-accent-500/10 text-accent-600 border border-accent-500/20',
  success:
    'bg-success-500/10 text-success-500 border border-success-500/20',
  warning:
    'bg-warning-500/10 text-warning-500 border border-warning-500/20',
  danger:
    'bg-danger-500/10 text-danger-500 border border-danger-500/20',
  info:
    'bg-surface-sunken text-fg-secondary border border-border/80',
  // No Nukkad semantic token exists for purple — it's a decorative one-off, not a status colour —
  // so it keeps its original hardcoded value rather than being mapped onto something that doesn't
  // fit. The custom `dark:` variant in index.css still makes it follow the app's own theme toggle.
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

