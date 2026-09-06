export type PostType = 'text' | 'startup_update' | 'idea' | 'opportunity' | 'event'

export type AttachmentKind = 'image' | 'video' | 'pdf'

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
  /** Only set on results from the dedicated saved-posts listing — when this post was saved. */
  savedAt?: string
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
