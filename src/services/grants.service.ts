import { apiClient, getPage } from '@/lib/api-client'
import type { CreateGrantInput, Grant, GrantProviderType, PublisherIdentityKey } from '@/types'

export interface GrantFilters {
  query?: string
  providerType?: GrantProviderType
  stage?: string
  sector?: string
  includeExpired?: boolean
  size?: number
}

interface GrantDto {
  id: string
  name: string
  provider: string
  providerType: string
  description: string | null
  fundingAmount: string | null
  eligibilityCriteria: string | null
  eligibleSectors: string[]
  eligibleStages: string[]
  deadline: string | null
  applicationUrl: string
  createdByUserId: string
  postedAsPlatform: boolean
  publisherIdentity: string
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: string
  rejectionReason: string | null
  canManage: boolean
  createdAt: string
  updatedAt: string
}

function mapGrant(dto: GrantDto): Grant {
  return {
    id: dto.id,
    name: dto.name,
    provider: dto.provider,
    providerType: dto.providerType as GrantProviderType,
    description: dto.description ?? undefined,
    fundingAmount: dto.fundingAmount ?? undefined,
    eligibilityCriteria: dto.eligibilityCriteria ?? undefined,
    eligibleSectors: dto.eligibleSectors,
    eligibleStages: dto.eligibleStages,
    deadline: dto.deadline ?? undefined,
    applicationUrl: dto.applicationUrl,
    createdByUserId: dto.createdByUserId,
    postedAsPlatform: dto.postedAsPlatform,
    publisherIdentity: dto.publisherIdentity as PublisherIdentityKey,
    removedByAdmin: dto.removedByAdmin,
    removalReason: dto.removalReason ?? undefined,
    moderationStatus: dto.moderationStatus as Grant['moderationStatus'],
    rejectionReason: dto.rejectionReason ?? undefined,
    canManage: dto.canManage,
    createdAt: dto.createdAt,
  }
}

export async function listGrants(filters: GrantFilters = {}): Promise<Grant[]> {
  const dtos = await getPage<GrantDto>('/grants', {
    q: filters.query,
    providerType: filters.providerType,
    stage: filters.stage,
    sector: filters.sector,
    includeExpired: filters.includeExpired,
    size: filters.size,
  })
  return dtos.map(mapGrant)
}

export async function getGrant(id: string): Promise<Grant | null> {
  try {
    return mapGrant(await apiClient.get<GrantDto>(`/grants/${id}`))
  } catch {
    // null, not undefined: TanStack Query v5 throws if a queryFn resolves to undefined.
    return null
  }
}

export async function createGrant(input: CreateGrantInput): Promise<Grant> {
  return mapGrant(
    await apiClient.post<GrantDto>('/grants', {
      name: input.name,
      provider: input.provider,
      providerType: input.providerType,
      description: input.description || undefined,
      fundingAmount: input.fundingAmount || undefined,
      eligibilityCriteria: input.eligibilityCriteria || undefined,
      eligibleSectors: input.eligibleSectors ?? [],
      eligibleStages: input.eligibleStages ?? [],
      deadline: input.deadline || undefined,
      applicationUrl: input.applicationUrl,
    }),
  )
}

export async function updateGrant(id: string, input: CreateGrantInput): Promise<Grant> {
  return mapGrant(
    await apiClient.put<GrantDto>(`/grants/${id}`, {
      name: input.name,
      provider: input.provider,
      providerType: input.providerType,
      description: input.description || undefined,
      fundingAmount: input.fundingAmount || undefined,
      eligibilityCriteria: input.eligibilityCriteria || undefined,
      eligibleSectors: input.eligibleSectors ?? [],
      eligibleStages: input.eligibleStages ?? [],
      deadline: input.deadline || undefined,
      applicationUrl: input.applicationUrl,
    }),
  )
}

export async function deleteGrant(id: string): Promise<void> {
  await apiClient.delete(`/grants/${id}`)
}
