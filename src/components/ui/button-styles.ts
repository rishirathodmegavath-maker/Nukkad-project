import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'accent' | 'outline' | 'ghost' | 'danger' | 'danger-subtle'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const secondaryClasses =
  'bg-surface text-fg hover:bg-surface-hover hover:border-border-strong active:bg-surface-sunken border border-border/80 font-medium shadow-xs'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs border border-brand-700/30 font-medium',
  secondary: secondaryClasses,
  // Same look as secondary: kept so existing call sites keep compiling, one visual style instead of two.
  outline: secondaryClasses,
  // Tinted, borderless-looking action for a low-emphasis button that still reads as clickable on a white card.
  soft: 'bg-brand-500/10 text-fg-brand hover:bg-brand-500/20 border border-brand-500/20 font-medium',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-xs border border-accent-600/30 font-medium',
  ghost:
    'bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg active:bg-surface-sunken font-medium',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-xs border border-danger-600/30 font-medium',
  'danger-subtle':
    'bg-danger-100/60 text-danger-600 dark:text-danger-400 hover:bg-danger-100 border border-transparent font-medium',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-4.5 text-sm gap-2 rounded-lg font-semibold',
  icon: 'size-9 rounded-lg p-0',
  'icon-sm': 'size-7.5 rounded-lg p-0',
}

const baseClasses =
  'inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]'

/** The class string a Button would get. Use it on a <Link> so navigation stays a real link
 *  (no <button> nested inside an <a>: two tab stops and invalid HTML). */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
}
