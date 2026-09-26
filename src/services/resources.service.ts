import { apiClient, downloadFile, getPage, getPagedResult, type Page } from '@/lib/api-client'
import type { PublisherIdentityKey, Resource, ResourceCategory, ResourceType } from '@/types'

export interface ResourceFilters {
  query?: string
  type?: ResourceType
  category?: ResourceCategory
  /** Only the resources on the front page shelf. */
  featured?: boolean
  chapterId?: string
  size?: number
}

/** The wire shape of a resource. Also used by the admin service, which returns the same object. */
export interface ResourceDto {
  id: string
  title: string
  description: string | null
  type: string
  category: string | null
  provider: string | null
  thumbnailUrl: string | null
  durationMinutes: number | null
  featured: boolean
  url: string
  uploaderUserId: string
  publisherIdentity: string
  chapterId: string | null
  chapterName: string | null
  tags: string[]
  isSaved: boolean
  fileName: string | null
  previewable: boolean
  createdAt: string
  updatedAt: string
}

export function mapResource(dto: ResourceDto): Resource {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    type: dto.type as ResourceType,
    category: (dto.category ?? undefined) as ResourceCategory | undefined,
    provider: dto.provider ?? undefined,
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
    durationMinutes: dto.durationMinutes ?? undefined,
    featured: dto.featured,
    url: dto.url,
    uploaderUserId: dto.uploaderUserId,
    publisherIdentity: dto.publisherIdentity as PublisherIdentityKey,
    chapterId: dto.chapterId ?? undefined,
    chapterName: dto.chapterName ?? undefined,
    tags: dto.tags,
    isSaved: dto.isSaved,
    fileName: dto.fileName ?? undefined,
    previewable: dto.previewable,
    createdAt: dto.createdAt,
  }
}

// Members can only browse, open, download and save resources — the library is curated by admins
// (see admin.service.ts for create / edit / delete), so there is deliberately no write call here.

function toParams(filters: ResourceFilters) {
  return {
    q: filters.query,
    type: filters.type,
    category: filters.category,
    featured: filters.featured,
    chapterId: filters.chapterId,
    size: filters.size,
  }
}

export async function listResources(filters: ResourceFilters = {}): Promise<Resource[]> {
  const dtos = await getPage<ResourceDto>('/resources', toParams(filters))
  return dtos.map(mapResource)
}

/**
 * A varied selection for the front page: one resource from each shelf and type in turn (a video, an essay, a
 * template, a tool ...) instead of only the newest uploads, so a bulk upload of one kind can't fill the page.
 * `preferFeatured` puts the ones the team featured first inside each group.
 */
export async function listResourceMix(options: { size?: number; preferFeatured?: boolean } = {}): Promise<Resource[]> {
  const query = new URLSearchParams()
  if (options.size !== undefined) query.set('size', String(options.size))
  if (options.preferFeatured) query.set('preferFeatured', 'true')
  const dtos = await apiClient.get<ResourceDto[]>(`/resources/mix?${query.toString()}`)
  return dtos.map(mapResource)
}

/** One page of the library, with the totals a pager needs. */
export async function listResourcesPage(filters: ResourceFilters, page: number): Promise<Page<Resource>> {
  const result = await getPagedResult<ResourceDto>('/resources', { ...toParams(filters), page })
  return { ...result, content: result.content.map(mapResource) }
}

export async function getResource(id: string): Promise<Resource | undefined> {
  try {
    return mapResource(await apiClient.get<ResourceDto>(`/resources/${id}`))
  } catch {
    return undefined
  }
}

export async function toggleSaveResource(id: string): Promise<{ saved: boolean }> {
  return apiClient.post<{ saved: boolean }>(`/resources/${id}/save`)
}

/** Saves a hosted file to the member's device. Opening it in the browser needs no call — see the detail page. */
export async function downloadResource(resource: Resource): Promise<void> {
  await downloadFile(`/resources/${resource.id}/download`, resource.fileName ?? resource.title)
}
