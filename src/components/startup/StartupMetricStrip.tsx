import type { ReactNode } from 'react'
import { Briefcase, CalendarDays, Heart, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCompactNumber } from '@/lib/startup-meta'

interface StartupMetricStripProps {
  followers: number
  /** Undefined while the list is still loading: the tile then shows a placeholder instead of a wrong "0". */
  teamMembers?: number
  openRoles?: number
  events?: number
}

function MetricTile({ icon, label, value }: { icon: ReactNode; label: string; value: number | undefined }) {
  if (value === undefined) return <Skeleton className="h-[62px] w-full rounded-xl xl:h-[76px]" />
  return (
    <Card padding="none" className="flex min-w-0 items-center gap-3 p-3 shadow-2xs xl:gap-3.5 xl:p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-fg-brand xl:size-11">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold leading-tight tracking-tight text-fg">{formatCompactNumber(value)}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-fg-muted">{label}</p>
      </div>
    </Card>
  )
}

/**
 * Four real counts about the startup. A count that is genuinely zero shows 0; a count still loading shows a skeleton,
 * never a made-up number. (How many investors have expressed interest is private to the founders, so it lives on their
 * dashboard and not on this public profile.)
 */
export function StartupMetricStrip({ followers, teamMembers, openRoles, events }: StartupMetricStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="list" aria-label="Startup at a glance">
      <div role="listitem">
        <MetricTile icon={<Heart className="size-4 xl:size-5" />} label={followers === 1 ? 'Follower' : 'Followers'} value={followers} />
      </div>
      <div role="listitem">
        <MetricTile icon={<Users className="size-4 xl:size-5" />} label={teamMembers === 1 ? 'Team member' : 'Team members'} value={teamMembers} />
      </div>
      <div role="listitem">
        <MetricTile icon={<Briefcase className="size-4 xl:size-5" />} label={openRoles === 1 ? 'Open role' : 'Open roles'} value={openRoles} />
      </div>
      <div role="listitem">
        <MetricTile icon={<CalendarDays className="size-4 xl:size-5" />} label={events === 1 ? 'Event' : 'Events'} value={events} />
      </div>
    </div>
  )
}
