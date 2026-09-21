import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** One look for every icon-only control (top bar, sidebar toggle, card actions). */
export const iconButtonClasses =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

/** Applied on top of iconButtonClasses when the control points at the page the user is on. */
export const iconButtonActiveClasses = 'bg-nav-active text-nav-fg-active hover:bg-nav-active hover:text-nav-fg-active'

interface IconButtonProps extends ComponentProps<'button'> {
  /** Accessible name. Icon-only controls have no visible text, so this is required. */
  label: string
}

export function IconButton({ label, className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cn(iconButtonClasses, className)} {...props}>
      {children}
    </button>
  )
}
