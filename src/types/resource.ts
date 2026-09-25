/** The format of a resource. (Which shelf it sits on is its `category`, below.) */
export type ResourceType = 'Document' | 'Link' | 'Video' | 'Note' | 'Template' | 'Article' | 'Guide' | 'Course' | 'Tool' | 'Deck'

/** The shelves of the library. Slugs match the backend's ResourceCategory. */
export type ResourceCategory =
  // Retired as a pickable shelf (everything in the library is free, so singling one shelf out as
  // "free" was misleading) — kept in the type only because older resources may still carry it.
  | 'free-learning'
  | 'videos'
  | 'templates' // shown as "Pitch Decks"; the slug is unchanged so resources already filed here keep working
  | 'playbooks' // shown as "Founder Reads"; same reason
  | 'startup-blocks' // shown as "Founder Stories"; same reason
  | 'programs'
  | 'tools'
  | 'government'

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  /** Absent for older resources that were never filed on a shelf. */
  category?: ResourceCategory
  /** Where the content comes from, as shown to members ("Y Combinator"). */
  provider?: string
  /** A hosted card image. When absent the UI derives one (a YouTube link) or draws a placeholder. */
  thumbnailUrl?: string
  durationMinutes?: number
  /** Shown on the library's front page shelf. */
  featured: boolean
  url: string
  uploaderUserId: string
  chapterId?: string
  chapterName?: string
  tags: string[]
  isSaved: boolean
  /** Set only for a file hosted on BuildAdda (the name a download is saved as); absent for an external link. */
  fileName?: string
  /** A hosted file the browser can show inline (PDF, image, video, plain text) instead of only downloading. */
  previewable: boolean
  createdAt: string
}
