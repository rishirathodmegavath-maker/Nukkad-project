import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * The one checkbox look used everywhere — filter toggles, form checkboxes, and the row/select-all
 * checkboxes behind bulk selection (AdminInvestorCatalogPage, AdminResourcesPage). Forwards its ref
 * so a caller can still set the DOM-only `.indeterminate` property imperatively for select-all.
 * Purely a style wrapper: every prop (checked, onChange, onClick, aria-label, disabled…) passes
 * through untouched, so it carries no selection or form logic of its own.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-4 shrink-0 cursor-pointer rounded-md border-border accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
