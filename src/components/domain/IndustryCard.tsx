import { Link } from 'react-router-dom'
import { TrendingUp, ChevronRight } from 'lucide-react'
import type { Industry } from '@/services/industries.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/** An industry in a list or grid — every number on it is derived from real startup/investor data. */
export function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <Card
      interactive
      className="group flex flex-col gap-3 border border-border/80 bg-surface shadow-xs transition-all hover:border-border-strong hover:shadow-sm"
    >
      <Link to={`/industries/${industry.slug}`} className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-fg-brand border border-border/80">
              <TrendingUp className="size-4.5" />
            </span>
            <h3 className="text-base font-bold text-fg">{industry.name}</h3>
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
            aria-hidden="true"
          />
        </div>
        <Badge tone="neutral">
          {industry.startupCount} {industry.startupCount === 1 ? 'startup' : 'startups'}
        </Badge>
      </Link>
    </Card>
  )
}
