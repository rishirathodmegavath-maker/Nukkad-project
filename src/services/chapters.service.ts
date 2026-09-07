import { apiClient, getPage, uploadFile } from '@/lib/api-client'
import { mapUser, type UserDto } from '@/services/users.service'
import type { Chapter, ChapterActivity, User } from '@/types'

interface ChapterDto {
  id: string
  name: string
  city: string | null
  country: string | null
  description: string | null
  coverImageUrl: string | null
  presidentUserId: string | null
  memberCount: number
  ideaCount: number
  startupCount: number
  opportunityCount: number
  eventCount: number
  resourceCount: number
  createdAt: string
  updatedAt: string
}

function mapChapter(dto: ChapterDto): Chapter {
  return {
    id: dto.id,
    name: dto.name,
    city: dto.city ?? '',
    country: dto.country ?? '',
    description: dto.description ?? '',
    coverImageUrl: dto.coverImageUrl ?? '',
    presidentUserId: dto.presidentUserId ?? undefined,
    memberCount: dto.memberCount,
    ideaCount: dto.ideaCount,
    startupCount: dto.startupCount,
    opportunityCount: dto.opportunityCount,
    eventCount: dto.eventCount,
    resourceCount: dto.resourceCount,
    createdAt: dto.createdAt,
  }
}

export interface ChapterFilters {
  query?: string
  presidentUserId?: string
}

export async function listChapters(filters: ChapterFilters | string = {}): Promise<Chapter[]> {
  const { query, presidentUserId } = typeof filters === 'string' ? { query: filters, presidentUserId: undefined } : filters
  const dtos = await getPage<ChapterDto>('/chapters', { q: query, presidentUserId })
  return dtos.map(mapChapter)
}

export async function getChapter(id: string): Promise<Chapter | undefined> {
  try {
    return mapChapter(await apiClient.get<ChapterDto>(`/chapters/${id}`))
  } catch {
    return undefined
  }
}

export interface CreateChapterInput {
  name: string
  city?: string
  country?: string
  description: string
  coverImageUrl?: string
}

export async function createChapter(input: CreateChapterInput): Promise<Chapter> {
  return mapChapter(await apiClient.post<ChapterDto>('/chapters', input))
}

export interface UpdateChapterInput {
  name?: string
  city?: string
  country?: string
  description?: string
}

export async function updateChapter(id: string, input: UpdateChapterInput): Promise<Chapter> {
  return mapChapter(await apiClient.put<ChapterDto>(`/chapters/${id}`, input))
}

export async function deleteChapter(id: string): Promise<void> {
  await apiClient.delete(`/chapters/${id}`)
}

export async function addChapterMember(chapterId: string, userId: string): Promise<User> {
  return mapUser(await apiClient.post<UserDto>(`/chapters/${chapterId}/members/${userId}`))
}

export async function removeChapterMember(chapterId: string, userId: string): Promise<User> {
  return mapUser(await apiClient.delete<UserDto>(`/chapters/${chapterId}/members/${userId}`))
}

export async function joinChapter(id: string): Promise<Chapter> {
  await apiClient.post(`/chapters/${id}/join`)
  const chapter = await getChapter(id)
  if (!chapter) throw new Error('Chapter not found')
  return chapter
}

export async function leaveChapter(id: string): Promise<Chapter> {
  await apiClient.post(`/chapters/${id}/leave`)
  const chapter = await getChapter(id)
  if (!chapter) throw new Error('Chapter not found')
  return chapter
}

export async function uploadChapterCover(id: string, file: File): Promise<Chapter> {
  return mapChapter(await uploadFile<ChapterDto>(`/chapters/${id}/cover`, file))
}

export async function removeChapterCover(id: string): Promise<Chapter> {
  return mapChapter(await apiClient.delete<ChapterDto>(`/chapters/${id}/cover`))
}

export async function listChapterActivity(id: string, limit = 10): Promise<ChapterActivity[]> {
  return apiClient.get<ChapterActivity[]>(`/chapters/${id}/activity?limit=${limit}`)
}
