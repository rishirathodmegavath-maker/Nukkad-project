import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string | number
  /** Where this stat's real detail lives — e.g. Investor interests -> the intro requests inbox. Omit when
   *  no such page exists (there is genuinely nowhere further to send someone for e.g. profile views today);
   *  the tile then stays a plain, non-interactive stat instead of a link to nothing. */
  to?: string
}

export function StatTile({ icon, label, value, to }: StatTileProps) {
  const content = (
    <>
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500/10 text-fg-brand border border-brand-500/20 shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-fg tracking-tight leading-tight">{value}</p>
        <p className="text-xs font-medium text-fg-muted truncate mt-0.5">{label}</p>
      </div>
    </>
  )
  const className = cn('flex items-center gap-3.5 shadow-2xs transition-shadow', to && 'hover:shadow-xs hover:border-border-strong cursor-pointer')

  if (to) {
    return (
      <Link to={to}>
        <Card padding="sm" className={className}>
          {content}
        </Card>
      </Link>
    )
  }
  return (
    <Card padding="sm" className={className}>
      {content}
    </Card>
  )
}

