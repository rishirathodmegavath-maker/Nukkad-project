import { Link } from 'react-router-dom'
import { ArrowRight, Lock, MapPin, Users } from 'lucide-react'
import type { Startup } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { ModerationBadge } from '@/components/domain/ModerationBadge'
import { STAGE_TONE, formatCompactNumber } from '@/lib/startup-meta'

/** A startup in a list or grid. Everything on it comes from the startup's real record; a missing field simply isn't shown. */
export function StartupCard({ startup }: { startup: Startup }) {
  const pitch = startup.tagline?.trim() || startup.problem?.trim() || startup.solution?.trim()
  const lookingFor = (startup.needs ?? []).slice(0, 2)

  return (
    <Card
      interactive
      padding="none"
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs transition-all hover:border-border-strong hover:shadow-sm"
    >
      <Link to={`/startups/${startup.id}`} className="flex h-full min-w-0 flex-col p-5">
        <div className="mb-3 flex items-start gap-3">
          <EntityLogo src={startup.logoUrl} name={startup.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-bold text-fg">{startup.name}</h3>
              {startup.visibility === 'Nukkad Members' && (
                <span title="Visible to BuildAdda members only" className="shrink-0 text-fg-muted">
                  <Lock className="size-3.5" aria-label="Members only" />
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-fg-secondary">
              {pitch || <span className="text-fg-muted">No description added yet.</span>}
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <ModerationBadge status={startup.moderationStatus} />
          <Badge tone={STAGE_TONE[startup.stage] ?? 'neutral'}>{startup.stage}</Badge>
          {startup.sector?.trim() && <Badge tone="neutral">{startup.sector}</Badge>}
          {startup.isRaising && (
            <Badge tone="accent" dot>
              Raising now
            </Badge>
          )}
        </div>

        {lookingFor.length > 0 && (
          <p className="mb-3 truncate text-xs text-fg-muted">
            <span className="font-medium text-fg-secondary">Looking for:</span> {lookingFor.join(', ')}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3.5 text-xs font-medium text-fg-muted">
          <div className="flex min-w-0 items-center gap-3">
            {startup.location?.trim() && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{startup.location}</span>
              </span>
            )}
            <span className="flex shrink-0 items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {formatCompactNumber(startup.followerCount)} {startup.followerCount === 1 ? 'follower' : 'followers'}
            </span>
          </div>
          <ArrowRight className="size-4 shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden="true" />
        </div>
      </Link>
    </Card>
  )
}
