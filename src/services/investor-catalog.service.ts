import { apiClient, getPagedResult, type Page } from '@/lib/api-client'
import type { CatalogInvestor, CatalogIntroductionResult, InvestorType } from '@/types'

export interface CatalogInvestorFilters {
  query?: string
  type?: InvestorType
  sector?: string
  stage?: string
  location?: string
  chequeSize?: number
}

interface CatalogInvestorDto {
  id: string
  name: string
  investorType: string
  description: string | null
  location: string | null
  website: string | null
  logoUrl: string | null
  sectors: string[]
  stages: string[]
  chequeMin: number | null
  chequeMax: number | null
  createdAt: string
}

function mapCatalogInvestor(dto: CatalogInvestorDto): CatalogInvestor {
  return {
    id: dto.id,
    name: dto.name,
    investorType: dto.investorType as InvestorType,
    description: dto.description ?? undefined,
    location: dto.location ?? undefined,
    website: dto.website ?? undefined,
    logoUrl: dto.logoUrl ?? undefined,
    sectors: dto.sectors,
    stages: dto.stages,
    chequeMin: dto.chequeMin ?? undefined,
    chequeMax: dto.chequeMax ?? undefined,
    createdAt: dto.createdAt,
  }
}

/** Whether the signed-in user may use Investor Discovery at all (an active Startup Profile — see AppRoutes'
 *  InvestorsListPage). The backend enforces this on every other call here too; this is only so the frontend can
 *  show the locked state instead of attempting, and failing, a real list call. */
export async function hasInvestorDiscoveryAccess(): Promise<boolean> {
  try {
    return await apiClient.get<boolean>('/investor-catalog/access')
  } catch {
    return false
  }
}

export async function listCatalogInvestors(filters: CatalogInvestorFilters = {}): Promise<Page<CatalogInvestor>> {
  const result = await getPagedResult<CatalogInvestorDto>('/investor-catalog', {
    q: filters.query,
    type: filters.type,
    sector: filters.sector,
    stage: filters.stage,
    location: filters.location,
    chequeSize: filters.chequeSize,
  })
  return { ...result, content: result.content.map(mapCatalogInvestor) }
}

export async function getCatalogInvestor(id: string): Promise<CatalogInvestor | null> {
  try {
    return mapCatalogInvestor(await apiClient.get<CatalogInvestorDto>(`/investor-catalog/${id}`))
  } catch {
    // null, not undefined: TanStack Query v5 throws if a queryFn resolves to undefined.
    return null
  }
}

interface CatalogIntroductionResultDto {
  kind: 'LIVE' | 'RECORDED'
  liveRequest: unknown | null
  recordedRequest: {
    id: string
    investorId: string
    investorName: string | null
    requesterUserId: string
    requesterName: string | null
    startupId: string
    startupName: string | null
    message: string
    status: 'PENDING' | 'CLOSED'
    createdAt: string
    closedAt: string | null
  } | null
}

export async function requestCatalogIntroduction(investorId: string, startupId: string, message: string): Promise<CatalogIntroductionResult> {
  const dto = await apiClient.post<CatalogIntroductionResultDto>(`/investor-catalog/${investorId}/introductions`, { startupId, message })
  return {
    kind: dto.kind,
    // The LIVE shape is the existing IntroRequestDto — left untyped here since only `kind` drives the UI;
    // the toast message differs, but nothing reads liveRequest's fields on this screen.
    liveRequest: dto.liveRequest as CatalogIntroductionResult['liveRequest'],
    recordedRequest: dto.recordedRequest
      ? {
          id: dto.recordedRequest.id,
          investorId: dto.recordedRequest.investorId,
          investorName: dto.recordedRequest.investorName ?? undefined,
          requesterUserId: dto.recordedRequest.requesterUserId,
          requesterName: dto.recordedRequest.requesterName ?? undefined,
          startupId: dto.recordedRequest.startupId,
          startupName: dto.recordedRequest.startupName ?? undefined,
          message: dto.recordedRequest.message,
          status: dto.recordedRequest.status,
          createdAt: dto.recordedRequest.createdAt,
          closedAt: dto.recordedRequest.closedAt ?? undefined,
        }
      : undefined,
  }
}
