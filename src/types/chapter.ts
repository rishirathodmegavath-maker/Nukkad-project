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
  logoUrl?: string
  presidentUserId?: string
  /** The chapter's real founding date, if known — distinct from `createdAt` (when the record was
   *  added), since an admin backfilling a long-running chapter needs to set the real date. */
  foundedAt?: string
  institution?: string
  type?: string
  focusAreas?: string[]
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
  discussionCount?: number
  createdAt: string
}
