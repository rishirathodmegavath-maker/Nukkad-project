import { apiClient, getPage } from '@/lib/api-client'
import { mapExperience, mapProject, mapUser, type ExperienceDto, type ProjectDto, type UserDto } from '@/services/users.service'
import type {
  Application,
  ApplicationStatus,
  ApplyToOpportunityInput,
  MatchLabel,
  Opportunity,
  OpportunityMatch,
  OpportunityType,
  PostOpportunityInput,
  WorkMode,
} from '@/types'

export interface OpportunityFilters {
  query?: string
  type?: OpportunityType
  workMode?: WorkMode
  chapterId?: string
  startupId?: string
  postedByUserId?: string
  size?: number
}

interface OpportunityDto {
  id: string
  title: string
  type: string
  closed: boolean
  startupId: string | null
  organizationName: string
  location: string | null
  workMode: string
  description: string
  responsibilities: string | null
  compensation: string | null
  equity: string | null
  experienceLevel: string | null
  applicationDeadline: string | null
  postedByUserId: string
  chapterId: string | null
  requirements: string[]
  requiredSkills: string[]
  hasApplied: boolean
  hasExpressedInterest: boolean
  applicationStatus: string | null
  applicantCount: number
  interestCount: number
  appliedAt: string | null
  moderationStatus: string
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

function mapOpportunity(dto: OpportunityDto): Opportunity {
  return {
    id: dto.id,
    title: dto.title,
    type: dto.type as OpportunityType,
    closed: dto.closed,
    startupId: dto.startupId ?? undefined,
    organizationName: dto.organizationName,
    location: dto.location ?? '',
    workMode: dto.workMode as WorkMode,
    description: dto.description,
    responsibilities: dto.responsibilities ?? undefined,
    requirements: dto.requirements,
    requiredSkills: dto.requiredSkills,
    compensation: dto.compensation ?? undefined,
    equity: dto.equity ?? undefined,
    experienceLevel: dto.experienceLevel ?? undefined,
    applicationDeadline: dto.applicationDeadline ?? undefined,
    postedByUserId: dto.postedByUserId,
    hasApplied: dto.hasApplied,
    hasExpressedInterest: dto.hasExpressedInterest,
    applicationStatus: (dto.applicationStatus as ApplicationStatus | null) ?? undefined,
    appliedAt: dto.appliedAt ?? undefined,
    applicantCount: dto.applicantCount,
    interestCount: dto.interestCount,
    chapterId: dto.chapterId ?? undefined,
    moderationStatus: dto.moderationStatus as Opportunity['moderationStatus'],
    rejectionReason: dto.rejectionReason ?? undefined,
    createdAt: dto.createdAt,
  }
}

export async function listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
  const dtos = await getPage<OpportunityDto>('/opportunities', {
    q: filters.query,
    type: filters.type,
    workMode: filters.workMode,
    chapterId: filters.chapterId,
    startupId: filters.startupId,
    postedByUserId: filters.postedByUserId,
    size: filters.size,
  })
  return dtos.map(mapOpportunity)
}

export async function getOpportunity(id: string): Promise<Opportunity | undefined> {
  try {
    return mapOpportunity(await apiClient.get<OpportunityDto>(`/opportunities/${id}`))
  } catch {
    return undefined
  }
}

export async function postOpportunity(input: PostOpportunityInput): Promise<Opportunity> {
  return mapOpportunity(
    await apiClient.post<OpportunityDto>('/opportunities', {
      title: input.title,
      type: input.type,
      startupId: input.startupId || undefined,
      organizationName: input.organizationName,
      location: input.location || undefined,
      workMode: input.workMode,
      description: input.description,
      responsibilities: input.responsibilities || undefined,
      requirements: input.requirements ?? [],
      requiredSkills: input.requiredSkills ?? [],
      compensation: input.compensation || undefined,
      equity: input.equity || undefined,
      experienceLevel: input.experienceLevel || undefined,
      applicationDeadline: input.applicationDeadline || undefined,
    }),
  )
}

export async function updateOpportunity(id: string, input: PostOpportunityInput): Promise<Opportunity> {
  return mapOpportunity(
    await apiClient.put<OpportunityDto>(`/opportunities/${id}`, {
      title: input.title,
      type: input.type,
      startupId: input.startupId || undefined,
      organizationName: input.organizationName,
      location: input.location || undefined,
      workMode: input.workMode,
      description: input.description,
      responsibilities: input.responsibilities || undefined,
      requirements: input.requirements ?? [],
      requiredSkills: input.requiredSkills ?? [],
      compensation: input.compensation || undefined,
      equity: input.equity || undefined,
      experienceLevel: input.experienceLevel || undefined,
      applicationDeadline: input.applicationDeadline || undefined,
    }),
  )
}

export async function deleteOpportunity(id: string): Promise<void> {
  await apiClient.delete(`/opportunities/${id}`)
}

export async function closeOpportunity(id: string): Promise<Opportunity> {
  return mapOpportunity(await apiClient.post<OpportunityDto>(`/opportunities/${id}/close`))
}

export async function reopenOpportunity(id: string): Promise<Opportunity> {
  return mapOpportunity(await apiClient.post<OpportunityDto>(`/opportunities/${id}/reopen`))
}

export async function listMyPosted(): Promise<Opportunity[]> {
  const dtos = await getPage<OpportunityDto>('/opportunities/me/posted')
  return dtos.map(mapOpportunity)
}

export async function listMyApplications(): Promise<Opportunity[]> {
  const dtos = await getPage<OpportunityDto>('/opportunities/me/applications')
  return dtos.map(mapOpportunity)
}

export async function expressInterestInOpportunity(id: string): Promise<Opportunity> {
  await apiClient.post(`/opportunities/${id}/interest`)
  const opp = await getOpportunity(id)
  if (!opp) throw new Error('Opportunity not found')
  return opp
}

interface ApplicationDto {
  id: string
  opportunityId: string
  opportunityTitle: string
  applicant: UserDto
  status: string
  whyInterested: string
  whyGoodFit: string
  relevantSkills: string[]
  relevantExperience: ExperienceDto[]
  relevantProjects: ProjectDto[]
  availability: string | null
  expectedCommitment: string | null
  additionalMessage: string | null
  createdAt: string
  reviewedAt: string | null
}

function mapApplication(dto: ApplicationDto): Application {
  return {
    id: dto.id,
    opportunityId: dto.opportunityId,
    opportunityTitle: dto.opportunityTitle,
    applicant: mapUser(dto.applicant),
    status: dto.status as ApplicationStatus,
    whyInterested: dto.whyInterested,
    whyGoodFit: dto.whyGoodFit,
    relevantSkills: dto.relevantSkills,
    relevantExperience: dto.relevantExperience.map(mapExperience),
    relevantProjects: dto.relevantProjects.map(mapProject),
    availability: dto.availability ?? undefined,
    expectedCommitment: dto.expectedCommitment ?? undefined,
    additionalMessage: dto.additionalMessage ?? undefined,
    createdAt: dto.createdAt,
    reviewedAt: dto.reviewedAt ?? undefined,
  }
}

export async function applyToOpportunity(id: string, input: ApplyToOpportunityInput): Promise<Application> {
  const dto = await apiClient.post<ApplicationDto>(`/opportunities/${id}/apply`, input)
  return mapApplication(dto)
}

export async function withdrawApplication(opportunityId: string): Promise<void> {
  await apiClient.post(`/opportunities/${opportunityId}/withdraw`)
}

export async function listApplications(
  opportunityId: string,
  status?: ApplicationStatus,
): Promise<Application[]> {
  const dtos = await getPage<ApplicationDto>(`/opportunities/${opportunityId}/applications`, { status })
  return dtos.map(mapApplication)
}

export async function getApplication(applicationId: string): Promise<Application | undefined> {
  try {
    return mapApplication(await apiClient.get<ApplicationDto>(`/opportunities/applications/${applicationId}`))
  } catch {
    return undefined
  }
}

export async function shortlistApplication(applicationId: string): Promise<Application> {
  return mapApplication(await apiClient.post<ApplicationDto>(`/opportunities/applications/${applicationId}/shortlist`))
}

export async function acceptApplication(applicationId: string): Promise<Application> {
  return mapApplication(await apiClient.post<ApplicationDto>(`/opportunities/applications/${applicationId}/accept`))
}

export async function rejectApplication(applicationId: string): Promise<Application> {
  return mapApplication(await apiClient.post<ApplicationDto>(`/opportunities/applications/${applicationId}/reject`))
}

interface OpportunityMatchDto {
  opportunity: OpportunityDto
  score: number
  matchLabel: string
  reasons: string[]
}

function mapOpportunityMatch(dto: OpportunityMatchDto): OpportunityMatch {
  return { opportunity: mapOpportunity(dto.opportunity), score: dto.score, matchLabel: dto.matchLabel as MatchLabel, reasons: dto.reasons }
}

export async function listRecommendedOpportunities(limit = 10): Promise<OpportunityMatch[]> {
  const dtos = await apiClient.get<OpportunityMatchDto[]>(`/opportunities/recommended?limit=${limit}`)
  return dtos.map(mapOpportunityMatch)
}

export async function getOpportunityMatch(id: string): Promise<OpportunityMatch | undefined> {
  try {
    return mapOpportunityMatch(await apiClient.get<OpportunityMatchDto>(`/opportunities/${id}/match`))
  } catch {
    return undefined
  }
}
