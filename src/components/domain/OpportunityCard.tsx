import { Link } from 'react-router-dom'
import { MapPin, Briefcase } from 'lucide-react'
import type { Opportunity } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MatchReasons } from '@/components/domain/MatchReasons'
import { formatRelativeTime } from '@/lib/utils'

export function OpportunityCard({ opportunity, reasons }: { opportunity: Opportunity; reasons?: string[] }) {
  return (
    <Card interactive className="flex flex-col gap-3 rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden bg-surface">
      <Link to={`/opportunities/${opportunity.id}`} className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge tone="neutral">{opportunity.type}</Badge>
            {opportunity.closed && <Badge tone="danger">Closed</Badge>}
          </div>
          <span className="text-xs text-fg-muted font-medium">{formatRelativeTime(opportunity.createdAt)}</span>
        </div>
        <div>
          <h3 className="font-bold text-fg text-base leading-snug">{opportunity.title}</h3>
          <p className="text-sm text-fg-muted flex items-center gap-1.5 mt-1 font-medium">
            <Briefcase className="size-3.5 text-fg-muted/80 shrink-0" /> {opportunity.organizationName}
          </p>
          <p className="text-xs text-fg-muted flex items-center gap-1.5 mt-1">
            <MapPin className="size-3.5 text-fg-muted/80 shrink-0" /> {opportunity.location}
            {opportunity.remote && ' · Remote friendly'}
          </p>
        </div>
      </Link>
      {reasons && reasons.length > 0 && <MatchReasons reasons={reasons} />}
      {opportunity.compensation && (
        <p className="text-xs font-semibold text-fg-secondary mt-auto pt-3 border-t border-border/60">
          {opportunity.compensation}
        </p>
      )}
    </Card>
  )
}
