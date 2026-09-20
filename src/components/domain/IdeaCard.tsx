import { Link } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import type { Idea } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { MatchReasons } from '@/components/domain/MatchReasons'
import { ModerationBadge } from '@/components/domain/ModerationBadge'
import { formatRelativeTime } from '@/lib/utils'

const stageTone: Record<Idea['stage'], BadgeTone> = {
  Concept: 'neutral',
  Validating: 'info',
  Building: 'brand',
  Launched: 'success',
}

export function IdeaCard({ idea, reasons }: { idea: Idea; reasons?: string[] }) {
  return (
    <Card
      interactive
      padding="none"
      className="flex flex-col rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden group bg-surface"
    >
      <Link to={`/ideas/${idea.id}`} className="flex flex-col p-5 h-full min-w-0">
        {/* Header: Stage and Time */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={stageTone[idea.stage] ?? 'neutral'}>{idea.stage}</Badge>
            <ModerationBadge status={idea.moderationStatus} />
          </div>
          <span className="text-xs text-fg-muted font-medium">
            {idea.createdAt ? formatRelativeTime(idea.createdAt) : 'Recently posted'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-fg leading-snug text-base mb-2">
          {idea.title}
        </h3>

        {/* Problem pitch */}
        <p className="text-sm text-fg-secondary line-clamp-2 leading-relaxed mb-4">
          {idea.problem?.trim() || idea.solution?.trim() || 'Early idea being explored on Buildadda.'}
        </p>

        {/* Help Needed Badges */}
        {idea.helpNeeded && idea.helpNeeded.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {idea.helpNeeded.slice(0, 3).map((area) => (
              <span
                key={area}
                className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-sunken text-fg-secondary border border-border/80 truncate max-w-full"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {reasons && reasons.length > 0 && <MatchReasons reasons={reasons} className="mb-4" />}

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-3.5 mt-auto border-t border-border/60 text-xs text-fg-muted font-medium">
          <span className="flex items-center gap-1.5 font-medium text-fg-secondary">
            <Users className="size-3.5" /> {idea.interestCount ?? 0} interested
          </span>
          <span className="flex items-center gap-1 text-fg-secondary group-hover:text-fg transition-colors font-medium">
            Explore idea <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </Card>
  )
}

