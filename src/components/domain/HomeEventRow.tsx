import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import type { NukkadEvent } from '@/types'
import { rsvpToEvent } from '@/services/events.service'
import { formatTimeOnly } from '@/lib/utils'
import { toast } from '@/store/toast.store'

/**
 * An upcoming event as a compact row for the Home page: date block, title, place and time, and a Register button that
 * registers straight from here (the event page has the full details and the option to cancel).
 */
export function HomeEventRow({ event }: { event: NukkadEvent }) {
  const queryClient = useQueryClient()
  const start = new Date(event.startAt)
  const full = event.capacity !== undefined && event.attendeeCount >= event.capacity && !event.isAttending

  const register = useMutation({
    mutationFn: () => rsvpToEvent(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', event.id] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not register for this event'),
  })

  return (
    <div className="flex items-center gap-3">
      <Link
        to={`/events/${event.id}`}
        className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-border/80 bg-surface-sunken/60 py-1.5 text-center leading-none"
        aria-label={`${event.title}, ${start.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{start.toLocaleDateString(undefined, { month: 'short' })}</span>
        <span className="mt-1 text-xl font-black text-fg">{start.getDate()}</span>
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/events/${event.id}`} className="block truncate text-sm font-bold text-fg hover:underline">
          {event.title}
        </Link>
        <p className="truncate text-xs text-fg-muted">{event.isOnline ? 'Online' : event.location || 'Location to be announced'}</p>
        <p className="truncate text-xs text-fg-muted">
          {formatTimeOnly(event.startAt)} – {formatTimeOnly(event.endAt)}
        </p>
      </div>

      {event.isAttending ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">
          <Check className="size-3.5" aria-hidden="true" />
          Registered
        </span>
      ) : (
        <button
          type="button"
          onClick={() => register.mutate()}
          disabled={register.isPending || full}
          className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:cursor-default disabled:opacity-60 cursor-pointer"
        >
          {full ? 'Full' : register.isPending ? 'Registering…' : 'Register'}
        </button>
      )}
    </div>
  )
}
