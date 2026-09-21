import { apiClient, getPage, uploadFile } from '@/lib/api-client'
import { mapUser, type UserDto } from '@/services/users.service'
import type { EventStartupSummary, NukkadEvent, StartupEventSummary, User } from '@/types'

export interface EventFilters {
  chapterId?: string
  upcoming?: boolean
  query?: string
  organizerUserId?: string
  size?: number
}

export interface EventInput {
  title: string
  description?: string
  chapterId?: string
  startAt: string
  endAt: string
  isOnline: boolean
  location?: string
  meetingUrl?: string
  coverImageUrl?: string
  capacity?: number
  /** Startups this event is tagged with — the creator must manage each one. Omit to leave unchanged on update. */
  startupIds?: string[]
}

interface EventStartupSummaryDto {
  id: string
  name: string
  logoUrl: string | null
}

interface EventDto {
  id: string
  title: string
  description: string | null
  chapterId: string | null
  chapterName: string | null
  organizerUserId: string
  startAt: string
  endAt: string
  online: boolean
  location: string | null
  meetingUrl: string | null
  coverImageUrl: string | null
  capacity: number | null
  attendeeCount: number
  isAttending: boolean
  canManage: boolean
  startups: EventStartupSummaryDto[]
  createdAt: string
  updatedAt: string
}

function mapEvent(dto: EventDto): NukkadEvent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    chapterId: dto.chapterId ?? undefined,
    chapterName: dto.chapterName ?? undefined,
    organizerUserId: dto.organizerUserId,
    startAt: dto.startAt,
    endAt: dto.endAt,
    isOnline: dto.online,
    location: dto.location ?? '',
    meetingUrl: dto.meetingUrl ?? undefined,
    coverImageUrl: dto.coverImageUrl ?? '',
    capacity: dto.capacity ?? undefined,
    attendeeCount: dto.attendeeCount,
    isAttending: dto.isAttending,
    canManage: dto.canManage,
    startups: (dto.startups ?? []).map((s): EventStartupSummary => ({ id: s.id, name: s.name, logoUrl: s.logoUrl ?? undefined })),
    createdAt: dto.createdAt,
  }
}

export async function listEvents(filters: EventFilters = {}): Promise<NukkadEvent[]> {
  const dtos = await getPage<EventDto>('/events', {
    chapterId: filters.chapterId,
    upcoming: filters.upcoming,
    q: filters.query,
    organizerUserId: filters.organizerUserId,
    size: filters.size,
  })
  return dtos.map(mapEvent)
}

export async function getEvent(id: string): Promise<NukkadEvent | undefined> {
  try {
    return mapEvent(await apiClient.get<EventDto>(`/events/${id}`))
  } catch {
    return undefined
  }
}

export async function getEventAttendees(id: string): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>(`/events/${id}/attendees`)
  return dtos.map(mapUser)
}

function toRequestBody(input: Partial<EventInput>) {
  return {
    title: input.title,
    description: input.description,
    chapterId: input.chapterId,
    startAt: input.startAt,
    endAt: input.endAt,
    online: input.isOnline,
    location: input.location,
    meetingUrl: input.meetingUrl,
    coverImageUrl: input.coverImageUrl,
    capacity: input.capacity,
    startupIds: input.startupIds,
  }
}

/** Uploads a picture to use as an event cover and returns its URL; send that URL as `coverImageUrl` when saving the event. */
export async function uploadEventCoverImage(file: File): Promise<string> {
  const dto = await uploadFile<{ url: string }>('/events/cover-images', file)
  return dto.url
}

export async function createEvent(input: EventInput): Promise<NukkadEvent> {
  return mapEvent(await apiClient.post<EventDto>('/events', toRequestBody(input)))
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<NukkadEvent> {
  return mapEvent(await apiClient.put<EventDto>(`/events/${id}`, toRequestBody(input)))
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`)
}

export async function rsvpToEvent(id: string): Promise<NukkadEvent> {
  return mapEvent(await apiClient.post<EventDto>(`/events/${id}/rsvp`))
}

export async function cancelEventRsvp(id: string): Promise<NukkadEvent> {
  return mapEvent(await apiClient.post<EventDto>(`/events/${id}/cancel-rsvp`))
}

interface StartupEventSummaryDto {
  id: string
  title: string
  startAt: string
  endAt: string
  online: boolean
  location: string | null
}

/** Events a given startup is tagged on — powers the startup profile's "Events" card. */
export async function getEventsForStartup(startupId: string): Promise<StartupEventSummary[]> {
  const dtos = await apiClient.get<StartupEventSummaryDto[]>(`/events/by-startup/${startupId}`)
  return dtos.map((d) => ({ id: d.id, title: d.title, startAt: d.startAt, endAt: d.endAt, isOnline: d.online, location: d.location ?? '' }))
}
