import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "1 member" / "2 members" — never a bare, always-plural noun tacked onto a count. */
export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Resolves a stored Resource URL to either an internal SPA route or a safe absolute external URL.
 * Defensive at render time (not just at save time) so already-bad rows created before URL
 * normalization existed still open correctly instead of falling through to the app root — a bare
 * href like "notion.so/doc" is otherwise resolved by the browser as *relative to the current page*,
 * not as an external destination.
 */
export function resolveResourceHref(url: string): { href: string; external: boolean } {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return { href: '', external: false }
  if (trimmed.startsWith('/')) return { href: trimmed, external: false }
  if (/^https?:\/\//i.test(trimmed)) return { href: trimmed, external: true }
  return { href: `https://${trimmed}`, external: true }
}

export function detectMeetingProvider(url: string): string {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'Video call'
  }
  if (host.includes('meet.google.com')) return 'Google Meet'
  if (host.includes('zoom.us') || host.includes('zoom.com')) return 'Zoom'
  if (host.includes('teams.microsoft.com') || host.includes('teams.live.com')) return 'Microsoft Teams'
  if (host.includes('webex.com')) return 'Webex'
  return 'Video call'
}

export function formatRelativeTime(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHr = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "just now" / "Xm ago" / "Xh ago" / "yesterday" / "Sep 2" — the exact Instagram-style read-receipt
 * phrasing, which formatRelativeTime doesn't produce (it says "1d ago" and keeps the year). */
export function formatSeenTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  if (date >= startOfYesterday && date < startOfToday) return 'yesterday'

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isPastDate(iso: string) {
  return new Date(iso).getTime() < Date.now()
}

export function buildGoogleCalendarUrl(event: {
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
}): string {
  const formatUtc = (iso: string) =>
    new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatUtc(event.startAt)}/${formatUtc(event.endAt)}`,
    details: event.description || '',
    location: event.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadIcsFile(event: {
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
}) {
  const formatUtc = (iso: string) =>
    new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, '')

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nukkad//Event Calendar//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title.replace(/\n/g, '\\n')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(event.location || '').replace(/\n/g, '\\n')}`,
    `DTSTART:${formatUtc(event.startAt)}`,
    `DTEND:${formatUtc(event.endAt)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
  return `₹${amount}`
}

let counter = 0
export function generateId(prefix = 'id') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Simulated network latency for the mock service layer — swap out when a real API lands. */
export function networkDelay() {
  return delay(280 + Math.random() * 320)
}
