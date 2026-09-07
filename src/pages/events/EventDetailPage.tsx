import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Video,
  Users,
  Calendar,
  Pencil,
  Trash2,
  ExternalLink,
  CalendarPlus,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Download,
} from 'lucide-react'
import { getEvent, getEventAttendees, rsvpToEvent, cancelEventRsvp, deleteEvent } from '@/services/events.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { CoverImage } from '@/components/ui/CoverImage'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { EventEditModal } from '@/components/domain/EventEditModal'
import {
  formatDateOnly,
  formatTimeOnly,
  detectMeetingProvider,
  buildGoogleCalendarUrl,
  downloadIcsFile,
  isPastDate,
} from '@/lib/utils'
import { toast } from '@/store/toast.store'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { data: currentUser } = useCurrentUser()

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  })

  const attendeesQuery = useQuery({
    queryKey: ['event', id, 'attendees'],
    queryFn: () => getEventAttendees(id!),
    enabled: !!id,
  })

  const { data: organizer } = useUser(event?.organizerUserId)

  const invalidateEvent = () => {
    queryClient.invalidateQueries({ queryKey: ['event', id] })
    queryClient.invalidateQueries({ queryKey: ['event', id, 'attendees'] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
  }

  const rsvpMutation = useMutation({
    mutationFn: () => rsvpToEvent(id!),
    onSuccess: () => {
      invalidateEvent()
      toast.success("You're registered for this event!")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not register'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelEventRsvp(id!),
    onSuccess: () => {
      invalidateEvent()
      toast.info('Registration cancelled')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel registration'),
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(organizer!.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: () => toast.error('Could not start conversation'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      if (event?.chapterId) queryClient.invalidateQueries({ queryKey: ['chapter', event.chapterId] })
      toast.info('Event deleted')
      navigate(event?.chapterId ? `/chapters/${event.chapterId}` : '/events')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete event')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !event) {
    return <ErrorState title="Couldn’t load this event" onRetry={refetch} />
  }

  const isFull = !event.isAttending && event.capacity !== undefined && event.attendeeCount >= event.capacity
  const isPast = isPastDate(event.endAt)
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - (event.attendeeCount ?? 0)) : null
  const capacityPercent = event.capacity ? Math.min(100, ((event.attendeeCount ?? 0) / event.capacity) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/events" className="hover:text-fg transition-colors">
          Events
        </Link>
        <ChevronRight className="size-3.5" />
        {event.chapterName && (
          <>
            <Link to={`/chapters/${event.chapterId}`} className="hover:text-fg transition-colors truncate max-w-[140px]">
              {event.chapterName}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-fg truncate max-w-sm">{event.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Event Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card padding="none" className="overflow-hidden rounded-2xl border border-border/80 shadow-xs bg-surface">
            {event.coverImageUrl && (
              <div className="h-56 sm:h-72 w-full bg-surface-sunken overflow-hidden">
                <CoverImage
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="size-full object-cover"
                  fallback={<div className="size-full bg-gradient-to-br from-brand-500/10 via-surface-sunken to-accent-500/10" />}
                />
              </div>
            )}

            <div className="p-6 sm:p-7">
              {/* Header tags & Action Row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="neutral">{event.isOnline ? 'Online' : 'In-Person'}</Badge>
                  {event.chapterName && (
                    <Link to={`/chapters/${event.chapterId}`}>
                      <Badge tone="neutral" className="hover:border-border-strong transition-colors cursor-pointer">
                        {event.chapterName}
                      </Badge>
                    </Link>
                  )}
                  {event.isAttending && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-md">
                      <CheckCircle2 className="size-3.5" /> Registered
                    </span>
                  )}
                  {isPast && <Badge tone="neutral">Past Event</Badge>}
                </div>

                {event.canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger-subtle"
                      size="sm"
                      leftIcon={<Trash2 className="size-3.5" />}
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Event Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight leading-tight mb-4">
                {event.title}
              </h1>

              {/* Time & Location Grid */}
              <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-sunken/60 border border-border/70 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-surface text-fg-secondary border border-border/80 shrink-0">
                    <Calendar className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">Date & Time</p>
                    <p className="text-sm font-semibold text-fg mt-0.5">{formatDateOnly(event.startAt)}</p>
                    <p className="text-xs text-fg-muted font-medium mt-0.5">
                      {formatTimeOnly(event.startAt)} – {formatTimeOnly(event.endAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-surface text-fg-secondary border border-border/80 shrink-0">
                    {event.isOnline ? <Video className="size-4.5" /> : <MapPin className="size-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">Location</p>
                    <p className="text-sm font-semibold text-fg mt-0.5 truncate">
                      {event.isOnline
                        ? event.meetingUrl
                          ? detectMeetingProvider(event.meetingUrl)
                          : 'Online Event'
                        : event.location}
                    </p>
                    <p className="text-xs text-fg-muted font-medium mt-0.5">
                      {event.isOnline ? 'Link available upon registration' : 'In-person venue'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-fg-muted mb-2">About This Event</h2>
                <div className="text-sm sm:text-base text-fg leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Registration / RSVP Card */}
          <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface flex flex-col gap-4">
            <div>
              <h2 className="font-bold text-base text-fg">Registration</h2>
              <p className="text-xs text-fg-muted mt-0.5">
                {isPast
                  ? 'This event has already ended'
                  : event.isAttending
                    ? 'You are confirmed to attend'
                    : isFull
                      ? 'Registration is currently full'
                      : 'Free registration for community members'}
              </p>
            </div>

            {/* Capacity Progress if configured */}
            {event.capacity !== undefined && event.capacity > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-fg-muted">Capacity</span>
                  <span className="text-fg font-semibold">
                    {event.attendeeCount ?? 0} / {event.capacity} ({spotsLeft} spots left)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className="h-full bg-brand-600 dark:bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            )}

            {!isPast && (
              <Button
                className="w-full font-bold"
                variant={event.isAttending ? 'secondary' : 'primary'}
                disabled={!event.isAttending && isFull}
                isLoading={rsvpMutation.isPending || cancelMutation.isPending}
                onClick={() => (event.isAttending ? cancelMutation.mutate() : rsvpMutation.mutate())}
              >
                {event.isAttending ? 'Cancel registration' : isFull ? 'Event full' : 'RSVP for Event'}
              </Button>
            )}

            {/* Online Meeting URL */}
            {event.isOnline && event.meetingUrl && (
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full font-medium" leftIcon={<ExternalLink className="size-3.5" />}>
                  Join via {detectMeetingProvider(event.meetingUrl)}
                </Button>
              </a>
            )}

            {/* Add to Calendar Menu */}
            {!isPast && (
              <DropdownMenu
                align="right"
                trigger={
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<CalendarPlus className="size-3.5" />}>
                    Add to Calendar
                  </Button>
                }
              >
                <DropdownItem
                  icon={<Calendar className="size-4" />}
                  onClick={() => window.open(buildGoogleCalendarUrl(event), '_blank')}
                >
                  Google Calendar
                </DropdownItem>
                <DropdownItem
                  icon={<Download className="size-4" />}
                  onClick={() => downloadIcsFile(event)}
                >
                  Apple Calendar / Outlook (.ics)
                </DropdownItem>
              </DropdownMenu>
            )}

            {/* Attendees preview */}
            <div className="pt-4 border-t border-border/60">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-1.5">
                  <Users className="size-3.5" /> Attendees ({event.attendeeCount ?? 0})
                </span>
              </div>

              {(attendeesQuery.data ?? []).length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {(attendeesQuery.data ?? []).slice(0, 10).map((user) => (
                    <Link key={user.id} to={`/people/${user.id}`} title={user.name}>
                      <Avatar src={user.avatarUrl} name={user.name} size="sm" className="ring-2 ring-surface hover:scale-105 transition-transform" />
                    </Link>
                  ))}
                  {(attendeesQuery.data ?? []).length > 10 && (
                    <span className="text-xs text-fg-muted font-medium ml-1">
                      +{(attendeesQuery.data ?? []).length - 10} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-fg-muted">Be the first to RSVP!</p>
              )}
            </div>
          </Card>

          {/* Organizer Card */}
          {organizer && (
            <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface flex flex-col gap-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-fg-muted">Organized by</h2>
              <Link to={`/people/${organizer.id}`} className="flex items-center gap-3 group">
                <Avatar src={organizer.avatarUrl} name={organizer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-fg group-hover:underline truncate">{organizer.name}</p>
                  <p className="text-xs text-fg-muted truncate">{organizer.headline || organizer.role || 'Event Host'}</p>
                  {organizer.location && <p className="text-[11px] text-fg-muted truncate mt-0.5">{organizer.location}</p>}
                </div>
              </Link>

              {currentUser && currentUser.id !== organizer.id && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<MessageSquare className="size-3.5" />}
                  isLoading={messageMutation.isPending}
                  onClick={() => messageMutation.mutate()}
                  className="w-full mt-1"
                >
                  Message Host
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      <EventEditModal open={editOpen} onClose={() => setEditOpen(false)} event={event} />

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this event?"
        description={`"${event.title}" will be removed and registered attendees will be notified. This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete event
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Are you sure you want to permanently delete this event?</p>
      </Modal>
    </div>
  )
}
