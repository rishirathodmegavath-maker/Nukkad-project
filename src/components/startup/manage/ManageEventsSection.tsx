import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Link2, Unlink } from 'lucide-react'
import { getEventsForStartup, linkStartupToEvent, listEvents, unlinkStartupFromEvent } from '@/services/events.service'
import { getCurrentUserId } from '@/services/users.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE, formatEventWhen } from '@/components/startup/event-meta'
import { isPastDate } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Startup, StartupEventSummary } from '@/types'

/**
 * The events this startup is on. Anyone who manages the startup can take it off an event; putting it on one needs you
 * to run that event too (the server checks both), so the choices are the events you organise.
 */
export function ManageEventsSection({ startup }: { startup: Startup }) {
  const queryClient = useQueryClient()
  const myId = getCurrentUserId()
  const [chosen, setChosen] = useState('')
  const [toUnlink, setToUnlink] = useState<StartupEventSummary | null>(null)

  const linked = useQuery({ queryKey: ['startup', startup.id, 'events'], queryFn: () => getEventsForStartup(startup.id) })
  // Events I organise. The server says which of them I can manage; ones I no longer run are left out.
  const organised = useQuery({
    queryKey: ['events', 'organised-by', myId],
    queryFn: () => listEvents({ organizerUserId: myId, size: 50 }),
    enabled: !!myId,
  })

  const refresh = (eventId: string) => {
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id, 'events'] })
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
  }

  const link = useMutation({
    mutationFn: (eventId: string) => linkStartupToEvent(eventId, startup.id),
    onSuccess: (event) => {
      refresh(event.id)
      setChosen('')
      toast.success(`${startup.name} is now on ${event.title}`)
    },
    onError: (err) => toast.error(err instanceof Error && err.message ? err.message : 'Could not link the event'),
  })
  const unlink = useMutation({
    mutationFn: (event: StartupEventSummary) => unlinkStartupFromEvent(event.id, startup.id),
    onSuccess: (_, event) => {
      refresh(event.id)
      setToUnlink(null)
      toast.info(`${startup.name} was taken off ${event.title}`)
    },
    onError: (err) => {
      setToUnlink(null)
      toast.error(err instanceof Error && err.message ? err.message : 'Could not take the startup off this event')
    },
  })

  if (linked.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
  if (linked.isError || !linked.data) return <ErrorState title="Couldn’t load events" onRetry={() => linked.refetch()} />

  const linkedIds = new Set(linked.data.map((e) => e.id))
  const choices = (organised.data ?? []).filter((e) => e.canManage && !linkedIds.has(e.id))

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Events" description="The events this startup is taking part in. They show on its profile and on each event’s page." icon={<CalendarDays className="size-4" />}>
        {linked.data.length === 0 ? (
          <p className="text-sm text-fg-muted">This startup isn’t on any events yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {linked.data.map((event) => (
              <li key={event.id}>
                <Card padding="sm" variant="sunken" className="flex flex-col gap-3 shadow-none sm:flex-row sm:items-center sm:justify-between" data-testid="linked-event">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/events/${event.id}`} className="text-sm font-semibold text-fg [overflow-wrap:anywhere] hover:underline">
                        {event.title}
                      </Link>
                      <Badge tone={EVENT_STATUS_TONE[event.status]}>{EVENT_STATUS_LABEL[event.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-fg-muted [overflow-wrap:anywhere]">{formatEventWhen(event.startAt, event.endAt)}</p>
                  </div>
                  <Button size="sm" variant="danger-subtle" leftIcon={<Unlink className="size-3.5" />} onClick={() => setToUnlink(event)}>
                    Take off event
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Link an event" description="Put this startup on an event you organise." icon={<Link2 className="size-4" />}>
        {organised.isLoading ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : organised.isError ? (
          <p className="text-sm text-danger-500">We couldn’t load your events. Try again in a moment.</p>
        ) : choices.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select id="msf-link-event" label="Event" value={chosen} onChange={(e) => setChosen(e.target.value)} className="sm:flex-1">
              <option value="">Choose an event…</option>
              {choices.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {new Date(event.startAt).toLocaleDateString()}
                  {isPastDate(event.endAt) ? ' (ended)' : ''}
                </option>
              ))}
            </Select>
            <Button disabled={!chosen} isLoading={link.isPending} onClick={() => link.mutate(chosen)}>
              Link event
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-fg-muted">
              {(organised.data ?? []).some((e) => e.canManage)
                ? 'Every event you organise already has this startup on it.'
                : 'You don’t organise any events yet. Events you organise can be linked here.'}
            </p>
            <Link to="/events/new" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              Create an event
            </Link>
          </div>
        )}
      </SectionCard>

      <Modal
        open={!!toUnlink}
        onClose={() => (unlink.isPending ? undefined : setToUnlink(null))}
        title="Take this startup off the event?"
        description={`${startup.name} will no longer be listed on “${toUnlink?.title ?? 'this event'}”, and the event will no longer show on your profile. The event itself isn’t changed.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToUnlink(null)} disabled={unlink.isPending}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={unlink.isPending} onClick={() => toUnlink && unlink.mutate(toUnlink)}>
              Take off event
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">If the event’s organizer adds it again, it will show up again.</p>
      </Modal>
    </div>
  )
}
