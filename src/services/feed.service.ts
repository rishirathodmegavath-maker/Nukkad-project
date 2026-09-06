import { apiClient, getPage, uploadFile, type Page } from '@/lib/api-client'
import type { AttachmentKind, Post, PostAttachment, PostComment, PostLiker, PostType, SavedPostsSort } from '@/types'

interface AttachmentDto {
  id: string
  url: string
  kind: string
  fileName: string | null
}

export interface PostDto {
  id: string
  authorId: string
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
  }
}

export async function listFeed(authorId?: string, size?: number): Promise<Post[]> {
  const dtos = await getPage<PostDto>('/feed', { authorId, size })
  return dtos.map(mapPost)
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

export async function createPost(
  content: string,
  type: PostType = 'text',
  relatedId?: string,
  attachments: AttachmentRef[] = [],
): Promise<Post> {
  const dto = await apiClient.post<PostDto>('/feed', { content, type, relatedId, attachments })
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
