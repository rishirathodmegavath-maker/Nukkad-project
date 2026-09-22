import { apiClient, getPage } from '@/lib/api-client'
import { mapUser, type UserDto } from '@/services/users.service'
import type { Fundraise, FundraiseStatus, InvestorProfile, InvestorType } from '@/types'

export interface InvestorFilters {
  query?: string
  type?: InvestorType
  sector?: string
  stage?: string
  geography?: string
  ticketSize?: number
}

export interface InvestorProfileInput {
  investorType: InvestorType
  firmName?: string
  thesis?: string
  sectors: string[]
  stages: string[]
  geographies: string[]
  ticketMin?: number
  ticketMax?: number
  portfolioCount?: number
  website?: string
}

export interface FundraiseFilters {
  status?: FundraiseStatus
  stage?: string
}

export interface CreateFundraiseInput {
  startupId: string
  targetAmount: number
  fundingStage: string
  useOfFunds?: string
  minimumTicket?: number
}

export interface UpdateFundraiseInput {
  targetAmount?: number
  amountRaised?: number
  fundingStage?: string
  useOfFunds?: string
  minimumTicket?: number
}

interface InvestorProfileDto {
  id: string
  userId: string
  user: UserDto | null
  investorType: string
  firmName: string | null
  thesis: string | null
  sectors: string[]
  stages: string[]
  geographies: string[]
  ticketMin: number | null
  ticketMax: number | null
  portfolioCount: number
  website: string | null
  canManage: boolean
  createdAt: string
  updatedAt: string
}

function mapInvestorProfile(dto: InvestorProfileDto): InvestorProfile {
  return {
    id: dto.id,
    userId: dto.userId,
    user: dto.user ? mapUser(dto.user) : undefined,
    investorType: dto.investorType as InvestorType,
    firmName: dto.firmName ?? undefined,
    thesis: dto.thesis ?? undefined,
    sectors: dto.sectors,
    stages: dto.stages,
    geographies: dto.geographies,
    ticketMin: dto.ticketMin ?? undefined,
    ticketMax: dto.ticketMax ?? undefined,
    portfolioCount: dto.portfolioCount,
    website: dto.website ?? undefined,
    canManage: dto.canManage,
    createdAt: dto.createdAt,
  }
}

export async function listInvestors(filters: InvestorFilters = {}): Promise<InvestorProfile[]> {
  const dtos = await getPage<InvestorProfileDto>('/investors', {
    q: filters.query,
    type: filters.type,
    sector: filters.sector,
    stage: filters.stage,
    geography: filters.geography,
    ticketSize: filters.ticketSize,
  })
  return dtos.map(mapInvestorProfile)
}

export async function getInvestor(id: string): Promise<InvestorProfile | null> {
  try {
    return mapInvestorProfile(await apiClient.get<InvestorProfileDto>(`/investors/${id}`))
  } catch {
    // null, not undefined: TanStack Query v5 throws if a queryFn resolves to undefined.
    return null
  }
}

export async function getMyInvestorProfile(): Promise<InvestorProfile | null> {
  try {
    return mapInvestorProfile(await apiClient.get<InvestorProfileDto>('/investors/me'))
  } catch {
    return null
  }
}

export async function getInvestorByUserId(userId: string): Promise<InvestorProfile | null> {
  try {
    return mapInvestorProfile(await apiClient.get<InvestorProfileDto>(`/investors/by-user/${userId}`))
  } catch {
    return null
  }
}

export async function updateInvestorProfile(id: string, input: Partial<InvestorProfileInput>): Promise<InvestorProfile> {
  return mapInvestorProfile(await apiClient.put<InvestorProfileDto>(`/investors/${id}`, input))
}

export async function deleteInvestorProfile(id: string): Promise<void> {
  await apiClient.delete(`/investors/${id}`)
}

export type InvestorActivationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface InvestorActivationRequest {
  id: string
  status: InvestorActivationStatus
  investorType: InvestorType
  firmName?: string
  thesis?: string
  sectors: string[]
  stages: string[]
  geographies: string[]
  ticketMin?: number
  ticketMax?: number
  portfolioCount: number
  website?: string
  resultingProfileId?: string
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
}

interface InvestorActivationRequestDto {
  id: string
  status: InvestorActivationStatus
  investorType: string
  firmName: string | null
  thesis: string | null
  sectors: string[]
  stages: string[]
  geographies: string[]
  ticketMin: number | null
  ticketMax: number | null
  portfolioCount: number
  website: string | null
  resultingProfileId: string | null
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

function mapActivationRequest(dto: InvestorActivationRequestDto): InvestorActivationRequest {
  return {
    id: dto.id,
    status: dto.status,
    investorType: dto.investorType as InvestorType,
    firmName: dto.firmName ?? undefined,
    thesis: dto.thesis ?? undefined,
    sectors: dto.sectors,
    stages: dto.stages,
    geographies: dto.geographies,
    ticketMin: dto.ticketMin ?? undefined,
    ticketMax: dto.ticketMax ?? undefined,
    portfolioCount: dto.portfolioCount,
    website: dto.website ?? undefined,
    resultingProfileId: dto.resultingProfileId ?? undefined,
    reviewNote: dto.reviewNote ?? undefined,
    createdAt: dto.createdAt,
    reviewedAt: dto.reviewedAt ?? undefined,
  }
}

export async function submitInvestorActivation(input: InvestorProfileInput): Promise<InvestorActivationRequest> {
  return mapActivationRequest(await apiClient.post<InvestorActivationRequestDto>('/investors/activation-requests', input))
}

export async function getMyInvestorActivation(): Promise<InvestorActivationRequest | null> {
  try {
    return mapActivationRequest(await apiClient.get<InvestorActivationRequestDto>('/investors/activation-requests/me'))
  } catch {
    // null, not undefined: TanStack Query v5 throws if a queryFn resolves to undefined.
    return null
  }
}

interface FundraiseDto {
  id: string
  startupId: string
  startupName: string | null
  targetAmount: number
  amountRaised: number
  fundingStage: string
  useOfFunds: string | null
  minimumTicket: number | null
  status: string
  canManage: boolean
  createdAt: string
  updatedAt: string
}

function mapFundraise(dto: FundraiseDto): Fundraise {
  return {
    id: dto.id,
    startupId: dto.startupId,
    startupName: dto.startupName ?? undefined,
    targetAmount: dto.targetAmount,
    amountRaised: dto.amountRaised,
    fundingStage: dto.fundingStage,
    useOfFunds: dto.useOfFunds ?? undefined,
    minimumTicket: dto.minimumTicket ?? undefined,
    status: dto.status as FundraiseStatus,
    canManage: dto.canManage,
    createdAt: dto.createdAt,
  }
}

export async function listFundraises(filters: FundraiseFilters = {}): Promise<Fundraise[]> {
  const dtos = await getPage<FundraiseDto>('/fundraises', { status: filters.status, stage: filters.stage })
  return dtos.map(mapFundraise)
}

export async function getFundraise(id: string): Promise<Fundraise | undefined> {
  try {
    return mapFundraise(await apiClient.get<FundraiseDto>(`/fundraises/${id}`))
  } catch {
    return undefined
  }
}

export async function getFundraiseByStartup(startupId: string): Promise<Fundraise | undefined> {
  const dto = await apiClient.get<FundraiseDto | null>(`/fundraises/by-startup/${startupId}`)
  return dto ? mapFundraise(dto) : undefined
}

export async function createFundraise(input: CreateFundraiseInput): Promise<Fundraise> {
  return mapFundraise(await apiClient.post<FundraiseDto>('/fundraises', input))
}

export async function updateFundraise(id: string, input: UpdateFundraiseInput): Promise<Fundraise> {
  return mapFundraise(await apiClient.put<FundraiseDto>(`/fundraises/${id}`, input))
}

export async function closeFundraise(id: string): Promise<Fundraise> {
  return mapFundraise(await apiClient.post<FundraiseDto>(`/fundraises/${id}/close`))
}

/** Raising again after stopping: opens the startup's one fundraise back up. */
export async function reopenFundraise(id: string): Promise<Fundraise> {
  return mapFundraise(await apiClient.post<FundraiseDto>(`/fundraises/${id}/reopen`))
}
