import { apiClient, getPage, uploadFile, type Page } from '@/lib/api-client'
import type {
  AttachmentKind,
  Post,
  PostAttachment,
  PostComment,
  PostLiker,
  PostType,
  PostVisibility,
  PublisherIdentityKey,
  SavedPostsSort,
} from '@/types'

interface AttachmentDto {
  id: string
  url: string
  kind: string
  fileName: string | null
}

export interface PostDto {
  id: string
  authorId: string
  chapterId: string | null
  type: string
  content: string
  relatedId: string | null
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
  hideLikeCount: boolean
  commentsDisabled: boolean
  createdAt: string
  attachments: AttachmentDto[]
  savedAt: string | null
  removedByAdmin: boolean
  removalReason: string | null
  visibility: string
  linkUrl: string | null
  postedAsPlatform: boolean
  publisherIdentity: string
  platformEngagementCount: number
}

/** Ref to an already-uploaded, not-yet-attached file — same shape the upload endpoint returns and create-post expects. */
export interface AttachmentRef {
  url: string
  kind: string
  fileName?: string
}

function mapAttachment(dto: AttachmentDto): PostAttachment {
  return { id: dto.id, url: dto.url, kind: dto.kind.toLowerCase() as AttachmentKind, fileName: dto.fileName ?? undefined }
}

export function mapPost(dto: PostDto): Post {
  return {
    id: dto.id,
    authorId: dto.authorId,
    chapterId: dto.chapterId ?? undefined,
    type: dto.type as PostType,
    content: dto.content,
    relatedId: dto.relatedId ?? undefined,
    likesCount: dto.likesCount,
    commentsCount: dto.commentsCount,
    isLiked: dto.isLiked,
    isSaved: dto.isSaved,
    hideLikeCount: dto.hideLikeCount,
    commentsDisabled: dto.commentsDisabled,
    createdAt: dto.createdAt,
    attachments: dto.attachments.map(mapAttachment),
    savedAt: dto.savedAt ?? undefined,
    removedByAdmin: dto.removedByAdmin,
    removalReason: dto.removalReason ?? undefined,
    // Older responses (and a backend that has not been updated yet) have no visibility: those posts are public.
    visibility: dto.visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC',
    linkUrl: dto.linkUrl ?? undefined,
    postedAsPlatform: dto.postedAsPlatform,
    publisherIdentity: dto.publisherIdentity as PublisherIdentityKey,
    platformEngagementCount: dto.platformEngagementCount,
  }
}

/** `tag` (a hashtag without the "#") keeps only posts that use it. `chapterId` keeps only posts
 *  whose author's own chapter (at the time of posting) was this one — used by a chapter's Feed tab. */
export async function listFeed(authorId?: string, size?: number, type?: PostType, tag?: string, chapterId?: string): Promise<Post[]> {
  const dtos = await getPage<PostDto>('/feed', { authorId, size, type, tag, chapterId })
  return dtos.map(mapPost)
}

export interface TrendingTopic {
  /** Lowercase, without the "#". */
  tag: string
  /** How many recent posts used it. */
  postCount: number
}

/** The hashtags most used lately in posts the viewer may read (the server counts only those). */
export async function listTrendingTopics(limit = 5): Promise<TrendingTopic[]> {
  return apiClient.get<TrendingTopic[]>(`/feed/trending-topics?limit=${limit}`)
}

export interface ListSavedPostsParams {
  sort?: SavedPostsSort
  type?: PostType
  page?: number
  size?: number
}

/** Dedicated saved-posts query — queries the user's saves directly rather than filtering a page of
 * /feed, so a post saved long ago (long since scrolled past in the main feed) is still reachable. */
export async function listSavedPosts(params: ListSavedPostsParams = {}): Promise<Page<Post>> {
  const query = new URLSearchParams()
  if (params.sort) query.set('sort', params.sort)
  if (params.type) query.set('type', params.type)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  const result = await apiClient.get<Page<PostDto>>(`/feed/saved?${query.toString()}`)
  return { ...result, content: result.content.map(mapPost) }
}

export async function uploadAttachment(file: File): Promise<AttachmentRef> {
  return uploadFile<AttachmentRef>('/feed/attachments', file)
}

export interface CreatePostInput {
  content: string
  type?: PostType
  relatedId?: string
  attachments?: AttachmentRef[]
  visibility?: PostVisibility
  /** An http(s) link to show as a link card. */
  linkUrl?: string
}

export async function createPost({ content, type = 'text', relatedId, attachments = [], visibility = 'PUBLIC', linkUrl }: CreatePostInput): Promise<Post> {
  const dto = await apiClient.post<PostDto>('/feed', { content, type, relatedId, attachments, visibility, linkUrl })
  return mapPost(dto)
}

export async function toggleLike(id: string): Promise<Post> {
  const dto = await apiClient.post<PostDto>(`/feed/${id}/like`)
  return mapPost(dto)
}

export async function toggleSave(id: string): Promise<Post> {
  const dto = await apiClient.post<PostDto>(`/feed/${id}/save`)
  return mapPost(dto)
}

/** "Hide this post" — removes it from the viewer's own personalized feed going forward; never
 *  shown as an option for anyone else's view of it. */
export async function toggleHidePost(id: string): Promise<Post> {
  const dto = await apiClient.post<PostDto>(`/feed/${id}/hide`)
  return mapPost(dto)
}

export interface PersonalizedFeedResult {
  content: Post[]
  hasMore: boolean
}

interface PersonalizedFeedResultDto {
  content: PostDto[]
  hasMore: boolean
}

/**
 * The canonical personalized feed — the same ranking service Home and the Feed page's main tab
 * both call, so there is one recommendation engine, never two. Not offset-paginated: `excludeIds`
 * is every post id already shown in this scroll session, and the server excludes them directly,
 * so a dynamically-reranked feed never repeats or skips a post across batches the way naive page
 * numbers would once ranking shifts between fetches.
 */
export async function listPersonalizedFeed(size: number, excludeIds: string[] = []): Promise<PersonalizedFeedResult> {
  const query = new URLSearchParams({ size: String(size) })
  for (const id of excludeIds) query.append('excludeIds', id)
  const result = await apiClient.get<PersonalizedFeedResultDto>(`/feed/personalized?${query.toString()}`)
  return { content: result.content.map(mapPost), hasMore: result.hasMore }
}

export async function getPost(id: string): Promise<Post> {
  const dto = await apiClient.get<PostDto>(`/feed/${id}`)
  return mapPost(dto)
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete<void>(`/feed/${id}`)
}

export async function updatePost(id: string, content: string): Promise<Post> {
  const dto = await apiClient.patch<PostDto>(`/feed/${id}`, { content })
  return mapPost(dto)
}

export async function toggleHideLikeCount(id: string): Promise<Post> {
  const dto = await apiClient.patch<PostDto>(`/feed/${id}/hide-like-count`)
  return mapPost(dto)
}

export async function toggleCommentsDisabled(id: string): Promise<Post> {
  const dto = await apiClient.patch<PostDto>(`/feed/${id}/comments-disabled`)
  return mapPost(dto)
}

interface CommentDto {
  id: string
  postId: string
  parentCommentId: string | null
  authorId: string
  content: string
  replyCount: number
  createdAt: string
}

function mapComment(dto: CommentDto): PostComment {
  return {
    id: dto.id,
    postId: dto.postId,
    parentCommentId: dto.parentCommentId ?? undefined,
    authorId: dto.authorId,
    content: dto.content,
    replyCount: dto.replyCount,
    createdAt: dto.createdAt,
  }
}

export async function listComments(postId: string): Promise<PostComment[]> {
  const dtos = await getPage<CommentDto>(`/feed/${postId}/comments`)
  return dtos.map(mapComment)
}

export async function listReplies(postId: string, commentId: string): Promise<PostComment[]> {
  const dtos = await getPage<CommentDto>(`/feed/${postId}/comments/${commentId}/replies`)
  return dtos.map(mapComment)
}

export async function addComment(postId: string, content: string, parentCommentId?: string): Promise<PostComment> {
  const dto = await apiClient.post<CommentDto>(`/feed/${postId}/comments`, { content, parentCommentId })
  return mapComment(dto)
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await apiClient.delete<void>(`/feed/${postId}/comments/${commentId}`)
}

export async function listLikers(postId: string, page = 0, size = 50): Promise<Page<PostLiker>> {
  return apiClient.get<Page<PostLiker>>(`/feed/${postId}/likes?page=${page}&size=${size}`)
}
