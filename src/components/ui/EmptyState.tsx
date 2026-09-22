import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** Heading level of the title. Defaults to h2 (directly under the page's h1); pass 'h3' inside a section that already has an h2. */
  as?: 'h2' | 'h3'
}

export function EmptyState({ icon, title, description, action, className, as: Heading = 'h2' }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border/90 bg-surface-sunken/40',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-surface text-fg-brand border border-border/80 shadow-xs">
          {icon}
        </div>
      )}
      <Heading className="text-base font-bold text-fg tracking-tight">{title}</Heading>
      {description && <p className="mt-1.5 max-w-md text-sm text-fg-muted leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-danger-500/20 bg-danger-500/5">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-danger-500/10 text-danger-500 border border-danger-500/20">
        <AlertCircle className="size-6" />
      </div>
      <h2 className="text-base font-bold text-fg tracking-tight">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-fg-muted leading-relaxed">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 text-sm font-semibold text-fg-brand hover:opacity-80 cursor-pointer underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  )
}

