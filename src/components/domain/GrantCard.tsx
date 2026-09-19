import { Link } from 'react-router-dom'
import { Landmark, CalendarClock } from 'lucide-react'
import type { Grant } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function GrantCard({ grant }: { grant: Grant }) {
  return (
    <Card interactive className="flex flex-col gap-3 rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden bg-surface">
      <Link to={`/grants/${grant.id}`} className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="neutral">{grant.providerType}</Badge>
          {grant.deadline && (
            <span className="text-[11px] text-fg-muted font-medium flex items-center gap-1">
              <CalendarClock className="size-3" /> {new Date(grant.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-fg text-base leading-snug">{grant.name}</h3>
          <p className="text-sm text-fg-muted flex items-center gap-1.5 mt-1 font-medium">
            <Landmark className="size-3.5 text-fg-muted/80 shrink-0" /> {grant.provider}
          </p>
        </div>
        {grant.description && <p className="text-sm text-fg-secondary line-clamp-2">{grant.description}</p>}
      </Link>
      {grant.fundingAmount && (
        <p className="text-xs font-semibold text-fg-secondary mt-auto pt-3 border-t border-border/60">{grant.fundingAmount}</p>
      )}
    </Card>
  )
}
