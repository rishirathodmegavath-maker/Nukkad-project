import { apiClient, getPage, type Page } from '@/lib/api-client'
import type {
  AttachmentKind,
  Discussion,
  DiscussionComment,
  DiscussionSort,
  DiscussionStats,
  PostAttachment,
  PostVisibility,
  PublisherIdentityKey,
  TopicCount,
} from '@/types'
import type { AttachmentRef } from './feed.service'

interface AttachmentDto {
  id: string
  url: string
  kind: string
  fileName: string | null
}

interface DiscussionDto {
  id: string
  authorId: string
  postedAsPlatform: boolean
  publisherIdentity: string
  content: string
  visibility: string
  linkUrl: string | null
  topic: string | null
  topicLabel: string
  tags: string[]
  likesCount: number
  isLiked: boolean
  isSaved: boolean
  commentsCount: number
  netScore: number
  myVote: number
  viewsCount: number
  participantCount: number
  isFollowing: boolean
  commentsDisabled: boolean
  attachments: AttachmentDto[]
  removedByAdmin: boolean
  removalReason: string | null
  createdAt: string
  lastActivityAt: string
}

interface DiscussionCommentDto {
  id: string
  postId: string
  parentCommentId: string | null
  authorId: string
  content: string
  replyCount: number
  likesCount: number
  isLiked: boolean
  createdAt: string
}

function mapAttachment(dto: AttachmentDto): PostAttachment {
  return { id: dto.id, url: dto.url, kind: dto.kind.toLowerCase() as AttachmentKind, fileName: dto.fileName ?? undefined }
}

function mapDiscussion(dto: DiscussionDto): Discussion {
  return {
    id: dto.id,
    authorId: dto.authorId,
    postedAsPlatform: dto.postedAsPlatform,
    publisherIdentity: dto.publisherIdentity as PublisherIdentityKey,
    content: dto.content,
    visibility: (dto.visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC') as PostVisibility,
    linkUrl: dto.linkUrl ?? undefined,
    topic: dto.topic ?? undefined,
    topicLabel: dto.topicLabel,
    tags: dto.tags,
    likesCount: dto.likesCount,
    isLiked: dto.isLiked,
    isSaved: dto.isSaved,
    commentsCount: dto.commentsCount,
    netScore: dto.netScore,
    myVote: (dto.myVote > 0 ? 1 : dto.myVote < 0 ? -1 : 0) as -1 | 0 | 1,
    viewsCount: dto.viewsCount,
    participantCount: dto.participantCount,
    isFollowing: dto.isFollowing,
    commentsDisabled: dto.commentsDisabled,
    attachments: dto.attachments.map(mapAttachment),
    removedByAdmin: dto.removedByAdmin,
    removalReason: dto.removalReason ?? undefined,
    createdAt: dto.createdAt,
    lastActivityAt: dto.lastActivityAt,
  }
}

function mapComment(dto: DiscussionCommentDto): DiscussionComment {
  return {
    id: dto.id,
    postId: dto.postId,
    parentCommentId: dto.parentCommentId ?? undefined,
    authorId: dto.authorId,
    content: dto.content,
    replyCount: dto.replyCount,
    likesCount: dto.likesCount,
    isLiked: dto.isLiked,
    createdAt: dto.createdAt,
  }
}

export interface ListDiscussionsParams {
  sort?: DiscussionSort
  topic?: string
  tag?: string
  page?: number
  size?: number
}

export async function listDiscussions(params: ListDiscussionsParams = {}): Promise<Page<Discussion>> {
  const query = new URLSearchParams()
  query.set('sort', params.sort ?? 'recent')
  if (params.topic) query.set('topic', params.topic)
  if (params.tag) query.set('tag', params.tag)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  const result = await apiClient.get<Page<DiscussionDto>>(`/discussions?${query.toString()}`)
  return { ...result, content: result.content.map(mapDiscussion) }
}

/** Real, all-time counts per curated topic — every topic is included, even one nobody has used yet. */
export async function listTopics(): Promise<TopicCount[]> {
  return apiClient.get<TopicCount[]>('/discussions/topics')
}

/** Real platform-wide numbers (total discussions/replies/participants) for the sidebar. */
export async function getDiscussionStats(): Promise<DiscussionStats> {
  return apiClient.get<DiscussionStats>('/discussions/stats')
}

export interface CreateDiscussionInput {
  content: string
  topic?: string
  attachments?: AttachmentRef[]
  visibility?: PostVisibility
  linkUrl?: string
}

export async function createDiscussion(input: CreateDiscussionInput): Promise<Discussion> {
  const dto = await apiClient.post<DiscussionDto>('/discussions', input)
  return mapDiscussion(dto)
}

export async function getDiscussion(id: string): Promise<Discussion> {
  const dto = await apiClient.get<DiscussionDto>(`/discussions/${id}`)
  return mapDiscussion(dto)
}

export async function castVote(id: string, direction: 'up' | 'down'): Promise<Discussion> {
  const dto = await apiClient.post<DiscussionDto>(`/discussions/${id}/vote`, { direction })
  return mapDiscussion(dto)
}

export async function toggleFollowDiscussion(id: string): Promise<{ following: boolean }> {
  return apiClient.post<{ following: boolean }>(`/discussions/${id}/follow`)
}

export async function listDiscussionComments(postId: string): Promise<DiscussionComment[]> {
  const dtos = await getPage<DiscussionCommentDto>(`/discussions/${postId}/comments`)
  return dtos.map(mapComment)
}

export async function addDiscussionComment(postId: string, content: string, parentCommentId?: string): Promise<DiscussionComment> {
  const dto = await apiClient.post<DiscussionCommentDto>(`/discussions/${postId}/comments`, { content, parentCommentId })
  return mapComment(dto)
}

export async function deleteDiscussionComment(postId: string, commentId: string): Promise<void> {
  await apiClient.delete<void>(`/discussions/${postId}/comments/${commentId}`)
}

export async function toggleDiscussionCommentLike(postId: string, commentId: string): Promise<DiscussionComment> {
  const dto = await apiClient.post<DiscussionCommentDto>(`/discussions/${postId}/comments/${commentId}/like`)
  return mapComment(dto)
}

export async function listRelatedDiscussions(postId: string, limit = 5): Promise<Discussion[]> {
  const dtos = await apiClient.get<DiscussionDto[]>(`/discussions/${postId}/related?limit=${limit}`)
  return dtos.map(mapDiscussion)
}

export async function listDiscussionParticipants(postId: string): Promise<string[]> {
  return apiClient.get<string[]>(`/discussions/${postId}/participants`)
}
