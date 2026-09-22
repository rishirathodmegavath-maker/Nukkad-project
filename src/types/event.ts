export interface EventStartupSummary {
  id: string
  name: string
  logoUrl?: string
  /** Server-computed: the viewer runs the event, or founds/administers this startup, so may take it off the event. */
  canUnlink: boolean
}

/** Where an event is in time, worked out by the server from its start and end. */
export type EventStatus = 'UPCOMING' | 'LIVE' | 'ENDED'

export interface StartupEventSummary {
  id: string
  title: string
  startAt: string
  endAt: string
  isOnline: boolean
  location: string
  coverImageUrl?: string
  /** The chapter that runs the event; empty for an event a member organises on their own. */
  chapterName?: string
  status: EventStatus
}

export interface NukkadEvent {
  id: string
  title: string
  description: string
  chapterId?: string
  chapterName?: string
  organizerUserId: string
  startAt: string
  endAt: string
  location: string
  isOnline: boolean
  meetingUrl?: string
  coverImageUrl: string
  capacity?: number
  attendeeCount: number
  isAttending: boolean
  /** Server-computed: whether the viewer (admin, or this chapter's president) can edit/delete this event. */
  canManage: boolean
  /** Startups tagged on this event — a real stored relationship, not a text mention. */
  startups: EventStartupSummary[]
  createdAt: string
}
