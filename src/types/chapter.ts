export interface ChapterActivity {
  type: 'IDEA' | 'STARTUP' | 'OPPORTUNITY' | 'EVENT' | 'RESOURCE' | 'MEMBER_JOINED'
  entityId: string
  title: string | null
  actorUserId: string | null
  actorName: string | null
  actorAvatarUrl: string | null
  occurredAt: string
}

export interface Chapter {
  id: string
  name: string
  city: string
  country: string
  description: string
  coverImageUrl: string
  presidentUserId?: string
  /** Embedded id arrays (mock era). The real backend exposes counts instead — see
   *  memberCount/ideaCount/startupCount/opportunityCount. */
  memberIds?: string[]
  ideaIds?: string[]
  startupIds?: string[]
  opportunityIds?: string[]
  memberCount?: number
  ideaCount?: number
  startupCount?: number
  opportunityCount?: number
  eventCount?: number
  resourceCount?: number
  createdAt: string
}
