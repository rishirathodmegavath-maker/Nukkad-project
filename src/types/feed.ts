export type PostType =
  | 'text'
  | 'startup_update'
  | 'idea'
  | 'opportunity'
  | 'event'
  | 'discussion'
  | 'build_update'
  | 'question'
  | 'milestone' // shown as "Achievement"
  | 'feedback'
  | 'cofounder'
  | 'announcement'
  | 'resource'
  | 'hiring'
  | 'fundraising'
  | 'product_launch'

/** Who may read a post: everyone, or only the author and the author's connections. */
export type PostVisibility = 'PUBLIC' | 'CONNECTIONS'

/** `file` is a Word / PowerPoint / Excel document (PDFs keep their own kind). */
export type AttachmentKind = 'image' | 'video' | 'pdf' | 'file'

export interface PostAttachment {
  id: string
  url: string
  kind: AttachmentKind
  fileName?: string
}

export interface Post {
  id: string
  authorId: string
  /** The author's own chapter at the time of posting, if they were in one — lets a chapter's Feed
   *  tab show only its own members' posts. Derived server-side, never client-supplied. */
  chapterId?: string
  type: PostType
  content: string
  relatedId?: string
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  isSaved?: boolean
  hideLikeCount?: boolean
  commentsDisabled?: boolean
  createdAt: string
  attachments: PostAttachment[]
  visibility: PostVisibility
  /** An http(s) link the author attached; shown as a link card. */
  linkUrl?: string
  /** Only set on results from the dedicated saved-posts listing — when this post was saved. */
  savedAt?: string
  removedByAdmin?: boolean
  removalReason?: string
  /** True for an admin-published post left unattributed to any member — show `publisherIdentity` as
   *  the public author instead of the underlying admin account. */
  postedAsPlatform?: boolean
  /** Which publisher identity to display; only meaningful when postedAsPlatform is true. */
  publisherIdentity?: PublisherIdentityKey
  /** Seeded/platform-level engagement, kept alongside `likesCount` internally (never a real Like —
   *  never appears in the liker list, never changes when a real user likes/unlikes, never rendered
   *  as a number anywhere in the UI — see PostCard.tsx). Always 0 for a member's own post.
   *  `likesCount` itself always stays the real, togglable count. */
  platformEngagementCount?: number
}

/** Matches the backend's Post.PublisherIdentity enum constants exactly — see lib/publisher-identities.ts
 *  for display labels. A fixed, closed set; never free text. */
export type PublisherIdentityKey =
  | 'ARJUN_MEHTA'
  | 'KARAN_SHAH'
  | 'NEEL_KAPOOR'
  | 'VIKRAM_RAO'

export type SavedPostsSort = 'newestSaved' | 'oldestSaved' | 'newestPost' | 'oldestPost'

export interface PostComment {
  id: string
  postId: string
  parentCommentId?: string
  authorId: string
  content: string
  replyCount: number
  createdAt: string
}
