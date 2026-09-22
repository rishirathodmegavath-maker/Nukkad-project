import { Link } from 'react-router-dom'
import { ArrowRight, Landmark, CalendarClock } from 'lucide-react'
import type { Grant } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function GrantCard({ grant }: { grant: Grant }) {
  return (
    <Card interactive className="group flex flex-col rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden bg-surface">
      {/* Everything lives inside this one Link — the funding line and "View details" used to sit
          outside it, so that area showed a pointer cursor (from `interactive` above) but clicking
          it did nothing. */}
      <Link to={`/grants/${grant.id}`} className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="neutral">{grant.providerType}</Badge>
          {grant.deadline && (
            <span className="text-xs text-fg-muted font-medium flex items-center gap-1">
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

        <div className="mt-auto flex flex-col gap-1.5 pt-3 border-t border-border/60">
          {grant.fundingAmount && (
            <div>
              <p className="text-[11px] font-medium text-fg-muted uppercase tracking-wide">Funding</p>
              <p className="text-sm font-semibold text-fg-secondary">{grant.fundingAmount}</p>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-brand">
            View details
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Card>
  )
}
