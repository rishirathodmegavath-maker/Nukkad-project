import { Link } from 'react-router-dom'
import { TrendingUp, ArrowRight, Lock } from 'lucide-react'
import type { Startup } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

const stageTone: Record<Startup['stage'], BadgeTone> = {
  Idea: 'neutral',
  MVP: 'info',
  'Early Traction': 'brand',
  Growth: 'success',
  Scaling: 'success',
}

export function StartupCard({ startup }: { startup: Startup }) {
  const pitch =
    startup.tagline?.trim() ||
    startup.problem?.trim() ||
    startup.solution?.trim() ||
    'Early-stage venture building on Buildadda'

  return (
    <Card
      interactive
      padding="none"
      className="flex flex-col rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden group bg-surface"
    >
      <Link to={`/startups/${startup.id}`} className="flex flex-col p-5 h-full min-w-0">
        {/* Header: Logo, Name, Badges */}
        <div className="flex items-start gap-3 mb-3">
          {startup.logoUrl ? (
            <img
              src={startup.logoUrl}
              alt={startup.name}
              className="size-11 rounded-lg object-cover border border-border/80 shadow-2xs shrink-0"
            />
          ) : (
            <div className="size-11 rounded-lg bg-surface-sunken border border-border/80 flex items-center justify-center font-bold text-fg text-base shadow-2xs shrink-0">
              {startup.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-fg truncate text-base">
                {startup.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {startup.visibility === 'Nukkad Members' && (
                  <span title="Members only" className="text-fg-muted">
                    <Lock className="size-3.5" />
                  </span>
                )}
                {startup.isRaising && (
                  <Badge tone="accent" dot className="font-semibold shadow-2xs">
                    Raising
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Badge tone={stageTone[startup.stage] ?? 'neutral'} size="sm">
                {startup.stage}
              </Badge>
              {startup.sector && startup.sector.trim() && (
                <Badge tone="neutral" size="sm">
                  {startup.sector}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Pitch / Tagline */}
        <p className="text-sm text-fg-secondary line-clamp-2 leading-relaxed mb-4">
          {pitch}
        </p>

        {/* Traction Highlight if available */}
        {(startup.revenue || startup.users || startup.otherTraction || startup.traction) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sunken border border-border/60 text-xs font-semibold text-fg mb-3.5 min-w-0">
            <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{startup.revenue || startup.users || startup.otherTraction || startup.traction}</span>
          </div>
        )}

        {/* Needs / Looking For Badges */}
        {startup.needs && startup.needs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {startup.needs.slice(0, 3).map((need) => (
              <span
                key={need}
                className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-sunken text-fg-secondary border border-border/80 truncate max-w-full"
              >
                {need}
              </span>
            ))}
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-3.5 mt-auto border-t border-border/60 text-xs text-fg-muted font-medium">
          <span>{startup.createdAt ? formatRelativeTime(startup.createdAt) : 'Recently listed'}</span>
          <span className="flex items-center gap-1 text-fg-secondary group-hover:text-fg font-medium group-hover:translate-x-0.5 transition-all">
            View venture <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </Card>
  )
}

