import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  /** A button or link at the right of the heading. */
  action?: ReactNode
  /** A small icon before the title. */
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/** One titled block of a page: a card with a heading row (title, optional description and action) above its content. */
export function SectionCard({ title, description, action, icon, className, children }: SectionCardProps) {
  return (
    <Card padding="sm" className={cn('sm:p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            {icon && <span className="text-fg-muted">{icon}</span>}
            <span className="truncate">{title}</span>
          </h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted [overflow-wrap:anywhere]">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  )
}
