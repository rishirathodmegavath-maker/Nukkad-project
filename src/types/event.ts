export interface EventStartupSummary {
  id: string
  name: string
  logoUrl?: string
}

export interface StartupEventSummary {
  id: string
  title: string
  startAt: string
  endAt: string
  isOnline: boolean
  location: string
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
