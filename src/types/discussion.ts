import type { PostAttachment, PostVisibility, PublisherIdentityKey } from './feed'

/**
 * A discussion — a Post of type 'discussion' underneath, but with the real forum data Post never
 * carried: a curated topic, a vote score, a view count, a follow state and a participant count.
 * `content` is still the one real free-text field (no separate title exists on the backend); the UI
 * derives a headline from it the same way it already did before this feature existed.
 */
export interface Discussion {
  id: string
  authorId: string
  /** True for an admin-published discussion left unattributed to any member — show
   *  `publisherIdentity` as the public author instead of the underlying admin account. Never true
   *  for a normal member's own discussion, which always shows their real profile name. */
  postedAsPlatform: boolean
  /** Which publisher identity to display; only meaningful when postedAsPlatform is true. */
  publisherIdentity: PublisherIdentityKey
  content: string
  visibility: PostVisibility
  linkUrl?: string
  /** Undefined for a discussion made through the plain Feed composer (no topic picker there) — show it as "General". */
  topic?: string
  topicLabel: string
  /** The discussion's own hashtags (from its content), reused as its tag chips — not a separate tag system. */
  tags: string[]
  likesCount: number
  isLiked: boolean
  isSaved: boolean
  commentsCount: number
  /** SUM of every upvote (+1) / downvote (-1) — a real net score, not a fabricated "hot" number. */
  netScore: number
  /** This viewer's own vote: -1, 0 (none) or 1. */
  myVote: -1 | 0 | 1
  viewsCount: number
  /** |{author} ∪ {distinct repliers}| — derived, never stored or invented. */
  participantCount: number
  isFollowing: boolean
  commentsDisabled: boolean
  attachments: PostAttachment[]
  removedByAdmin: boolean
  removalReason?: string
  createdAt: string
  /** The later of the discussion's own createdAt and its most recent reply's createdAt. */
  lastActivityAt: string
}

export interface DiscussionComment {
  id: string
  postId: string
  parentCommentId?: string
  authorId: string
  content: string
  replyCount: number
  likesCount: number
  isLiked: boolean
  createdAt: string
}

/** One row of "Popular Topics" — count is real, live, all-time. */
export interface TopicCount {
  topic: string
  label: string
  count: number
}

/** Real platform-wide numbers for the Discussions sidebar. */
export interface DiscussionStats {
  totalDiscussions: number
  totalReplies: number
  totalParticipants: number
}

export type DiscussionSort = 'recent' | 'trending' | 'unanswered' | 'following' | 'mine'
