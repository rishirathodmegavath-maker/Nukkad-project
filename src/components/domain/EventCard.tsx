import { Link } from 'react-router-dom'
import { MapPin, Video, Clock, Users, CheckCircle2 } from 'lucide-react'
import type { NukkadEvent } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { detectMeetingProvider, formatTimeOnly, isPastDate } from '@/lib/utils'

export function EventCard({ event }: { event: NukkadEvent }) {
  const date = new Date(event.startAt)
  const isPast = isPastDate(event.endAt)

  return (
    <Card
      interactive
      padding="none"
      className="overflow-hidden rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all bg-surface min-w-0"
    >
      <Link to={`/events/${event.id}`} className="flex items-stretch h-full min-w-0">
        {/* Date block */}
        <div className="flex flex-col items-center justify-center w-20 shrink-0 bg-surface-sunken text-fg border-r border-border/80 p-3 text-center select-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">
            {date.toLocaleDateString(undefined, { month: 'short' })}
          </span>
          <span className="text-2xl font-black leading-none my-1 text-fg">
            {date.getDate()}
          </span>
          <span className="text-[11px] font-medium text-fg-muted">
            {date.toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </div>

        {/* Event Content */}
        <div className="p-4 sm:p-5 min-w-0 flex-1 flex flex-col justify-between">
          <div>
            {/* Badges & Status Row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <Badge tone="neutral" className="text-[11px] py-0.5">
                {event.isOnline ? 'Online' : 'In-Person'}
              </Badge>
              {event.chapterName && (
                <Badge tone="neutral" className="text-[11px] py-0.5">
                  {event.chapterName}
                </Badge>
              )}
              {event.isAttending && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="size-3" /> Registered
                </span>
              )}
              {isPast && (
                <Badge tone="neutral" className="text-[11px] py-0.5 opacity-70">
                  Past
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-fg truncate text-base leading-snug">
              {event.title}
            </h3>

            {/* Description preview */}
            <p className="text-xs sm:text-sm text-fg-muted line-clamp-2 mt-1 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 pt-3 mt-3 border-t border-border/60 text-xs text-fg-muted font-medium">
            <span className="flex items-center gap-1.5 truncate">
              <Clock className="size-3.5 text-fg-muted shrink-0" />
              <span>{formatTimeOnly(event.startAt)}</span>
            </span>

            <span className="flex items-center gap-1.5 min-w-0">
              {event.isOnline ? (
                <Video className="size-3.5 text-fg-muted shrink-0" />
              ) : (
                <MapPin className="size-3.5 text-fg-muted shrink-0" />
              )}
              <span className="truncate">
                {event.isOnline
                  ? event.meetingUrl
                    ? detectMeetingProvider(event.meetingUrl)
                    : 'Online Link'
                  : event.location}
              </span>
            </span>

            <span className="flex items-center gap-1.5 text-fg-secondary ml-auto shrink-0">
              <Users className="size-3.5 text-fg-muted shrink-0" />
              <span>
                {event.attendeeCount ?? 0}
                {event.capacity ? ` / ${event.capacity}` : ''} going
              </span>
            </span>
          </div>
        </div>
      </Link>
    </Card>
  )
}
