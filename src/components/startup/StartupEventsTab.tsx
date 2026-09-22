import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Video } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { CoverImage } from '@/components/ui/CoverImage'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE, formatEventWhen } from '@/components/startup/event-meta'
import type { SectionKey } from '@/components/startup/manage/manage-model'
import type { StartupEventSummary } from '@/types'

function EventCard({ event }: { event: StartupEventSummary }) {
  const ended = event.status === 'ENDED'
  return (
    <Card padding="none" className="flex min-w-0 flex-col overflow-hidden shadow-2xs" data-testid="startup-event">
      <Link to={`/events/${event.id}`} tabIndex={-1} aria-hidden="true" className="block">
        <CoverImage
          src={event.coverImageUrl}
          alt=""
          className={`aspect-[16/7] w-full object-cover ${ended ? 'opacity-70' : ''}`}
          fallback={
            <div className="flex aspect-[16/7] w-full items-center justify-center bg-gradient-to-br from-brand-500/10 via-surface-sunken to-accent-500/10 text-fg-muted">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>
          }
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={EVENT_STATUS_TONE[event.status]} dot={event.status === 'LIVE'}>
            {EVENT_STATUS_LABEL[event.status]}
          </Badge>
          <Badge tone="neutral">{event.isOnline ? 'Online' : 'In person'}</Badge>
          <Badge tone="neutral">{event.chapterName ?? 'Community event'}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug text-fg [overflow-wrap:anywhere]">
          <Link to={`/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-fg-muted">
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{formatEventWhen(event.startAt, event.endAt)}</span>
          </li>
          <li className="flex items-start gap-2">
            {event.isOnline ? <Video className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            <span className="[overflow-wrap:anywhere]">{event.isOnline ? 'Online' : event.location || 'Location to be announced'}</span>
          </li>
        </ul>
        <div className="mt-auto pt-1">
          <Link to={`/events/${event.id}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            View event
          </Link>
        </div>
      </div>
    </Card>
  )
}

interface StartupEventsTabProps {
  events?: StartupEventSummary[]
  loading: boolean
  error: boolean
  onRetry: () => void
  canManage: boolean
  onManage: (section: SectionKey) => void
}

/**
 * The events this startup is on, as they are stored: an event appears here only because it was put on the event by
 * someone who runs it and manages this startup. Upcoming and live events come first, ended ones after.
 */
export function StartupEventsTab({ events, loading, error, onRetry, canManage, onManage }: StartupEventsTabProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }
  if (error || !events) return <ErrorState title="Couldn’t load events" onRetry={onRetry} />

  if (events.length === 0) {
    return (
      <EmptyState
        as="h3"
        className="py-12"
        icon={<CalendarDays className="size-5" />}
        title={canManage ? 'Not on any events yet' : 'No events yet'}
        description={
          canManage
            ? 'Link an event you organise to show it here, so people can see where this startup is showing up.'
            : 'This startup isn’t part of any events right now.'
        }
        action={
          canManage ? (
            <Button size="sm" onClick={() => onManage('events')}>
              Link an event
            </Button>
          ) : undefined
        }
      />
    )
  }

  const current = events.filter((e) => e.status !== 'ENDED')
  const past = events.filter((e) => e.status === 'ENDED').reverse()

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => onManage('events')}>
            Manage events
          </Button>
        </div>
      )}
      {current.length > 0 && (
        <section aria-label="Upcoming events">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">Upcoming ({current.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {current.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section aria-label="Past events">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">Past ({past.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
