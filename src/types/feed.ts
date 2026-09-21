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
}

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

export interface PostLiker {
  userId: string
  createdAt: string
}
