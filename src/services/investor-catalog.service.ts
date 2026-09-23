import { apiClient, getPagedResult, type Page } from '@/lib/api-client'
import type { CatalogInvestor, CatalogIntroductionResult, InvestorType } from '@/types'

export interface CatalogInvestorFilters {
  query?: string
  type?: InvestorType
  sector?: string
  stage?: string
  location?: string
  country?: string
  chequeSize?: number
}

interface CatalogInvestorDto {
  id: string
  name: string
  investorType: string
  description: string | null
  location: string | null
  country: string | null
  website: string | null
  domain: string | null
  logoUrl: string | null
  sectors: string[]
  stages: string[]
  programs: string[]
  investmentCount: number | null
  exitCount: number | null
  keyPeople: string[]
  facebookUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
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
    country: dto.country ?? undefined,
    website: dto.website ?? undefined,
    domain: dto.domain ?? undefined,
    logoUrl: dto.logoUrl ?? undefined,
    sectors: dto.sectors,
    stages: dto.stages,
    programs: dto.programs ?? [],
    investmentCount: dto.investmentCount ?? undefined,
    exitCount: dto.exitCount ?? undefined,
    keyPeople: dto.keyPeople ?? [],
    facebookUrl: dto.facebookUrl ?? undefined,
    instagramUrl: dto.instagramUrl ?? undefined,
    linkedinUrl: dto.linkedinUrl ?? undefined,
    twitterUrl: dto.twitterUrl ?? undefined,
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

export async function listCatalogInvestors(filters: CatalogInvestorFilters = {}, page = 0, size = 20): Promise<Page<CatalogInvestor>> {
  const result = await getPagedResult<CatalogInvestorDto>('/investor-catalog', {
    q: filters.query,
    type: filters.type,
    sector: filters.sector,
    stage: filters.stage,
    location: filters.location,
    country: filters.country,
    chequeSize: filters.chequeSize,
    page,
    size,
  })
  return { ...result, content: result.content.map(mapCatalogInvestor) }
}

export interface CatalogFacets {
  sectors: string[]
  stages: string[]
}

/** The real sector/stage values currently in the catalog, for the filter dropdowns — sector and stage are
 *  free text with no fixed list (unlike investor type), so these come from the data itself rather than a
 *  guessed-at set of options. */
export async function getCatalogFacets(): Promise<CatalogFacets> {
  return apiClient.get<CatalogFacets>('/investor-catalog/facets')
}

/** A real live count for one filter combination (e.g. `{ type: 'VC' }`) — reads `totalElements` off a
 *  1-row page rather than fetching and counting rows client-side, so it stays correct at any catalog
 *  size. Used for the Investor Discovery sidebar's "Investor database" stats — real numbers, not copy. */
export async function countCatalogInvestors(filters: CatalogInvestorFilters = {}): Promise<number> {
  const result = await listCatalogInvestors(filters, 0, 1)
  return result.totalElements
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
