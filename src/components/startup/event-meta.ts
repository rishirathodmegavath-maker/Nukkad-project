import type { BadgeTone } from '@/components/ui/Badge'
import { formatTimeOnly } from '@/lib/utils'
import type { EventStatus } from '@/types'

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = { UPCOMING: 'Upcoming', LIVE: 'Happening now', ENDED: 'Ended' }
export const EVENT_STATUS_TONE: Record<EventStatus, BadgeTone> = { UPCOMING: 'info', LIVE: 'success', ENDED: 'neutral' }

/** "Sat, Oct 4, 2026 · 6:00 PM – 8:00 PM", or with both dates when the event runs past midnight. */
export function formatEventWhen(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const date = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  if (start.toDateString() === end.toDateString()) return `${date} · ${formatTimeOnly(startAt)} – ${formatTimeOnly(endAt)}`
  const endDate = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${date}, ${formatTimeOnly(startAt)} – ${endDate}, ${formatTimeOnly(endAt)}`
}
