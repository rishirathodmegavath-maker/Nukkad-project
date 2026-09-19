import { apiClient, getPage } from '@/lib/api-client'
import { mapExperience, mapProject, mapUser, type ExperienceDto, type ProjectDto, type UserDto } from '@/services/users.service'
import type { ContributionArea, ExpressInterestInput, Idea, IdeaInterest, IdeaMatch, IdeaStage, MatchLabel } from '@/types'

export interface IdeaFilters {
  query?: string
  stage?: IdeaStage
  category?: string
  helpNeeded?: ContributionArea
  chapterId?: string
  creatorId?: string
  size?: number
}

interface IdeaDto {
  id: string
  title: string
  problem: string
  solution: string
  targetCustomer: string | null
  stage: string
  category: string | null
  creatorId: string
  chapterId: string | null
  startupId: string | null
  tags: string[]
  helpNeeded: string[]
  teamMemberIds: string[]
  interestCount: number
  moderationStatus: string
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

function mapIdea(dto: IdeaDto): Idea {
  return {
    id: dto.id,
    title: dto.title,
    problem: dto.problem,
    solution: dto.solution,
    targetCustomer: dto.targetCustomer ?? '',
    stage: dto.stage as IdeaStage,
    helpNeeded: dto.helpNeeded as ContributionArea[],
    category: dto.category ?? '',
    tags: dto.tags,
    creatorId: dto.creatorId,
    chapterId: dto.chapterId ?? undefined,
    interestCount: dto.interestCount,
    teamUserIds: dto.teamMemberIds,
    startupId: dto.startupId ?? undefined,
    moderationStatus: dto.moderationStatus as Idea['moderationStatus'],
    rejectionReason: dto.rejectionReason ?? undefined,
    createdAt: dto.createdAt,
  }
}

export async function listIdeas(filters: IdeaFilters = {}): Promise<Idea[]> {
  const dtos = await getPage<IdeaDto>('/ideas', {
    q: filters.query,
    stage: filters.stage,
    category: filters.category,
    helpNeeded: filters.helpNeeded,
    chapterId: filters.chapterId,
    creatorId: filters.creatorId,
    size: filters.size,
  })
  return dtos.map(mapIdea)
}

export async function getIdea(id: string): Promise<Idea | undefined> {
  try {
    return mapIdea(await apiClient.get<IdeaDto>(`/ideas/${id}`))
  } catch {
    return undefined
  }
}

export interface PostIdeaPayload {
  title: string
  problem: string
  solution: string
  targetCustomer: string
  stage: IdeaStage
  category: string
  tags: string[]
  helpNeeded: ContributionArea[]
}

export async function postIdea(payload: PostIdeaPayload): Promise<Idea> {
  const dto = await apiClient.post<IdeaDto>('/ideas', payload)
  return mapIdea(dto)
}

export interface UpdateIdeaPayload {
  title?: string
  problem?: string
  solution?: string
  targetCustomer?: string
  stage?: IdeaStage
  category?: string
  tags?: string[]
  helpNeeded?: ContributionArea[]
}

export async function updateIdea(id: string, payload: UpdateIdeaPayload): Promise<Idea> {
  const dto = await apiClient.put<IdeaDto>(`/ideas/${id}`, payload)
  return mapIdea(dto)
}

export async function deleteIdea(id: string): Promise<void> {
  await apiClient.delete(`/ideas/${id}`)
}

interface IdeaInterestDto {
  id: string
  ideaId: string
  ideaTitle: string
  applicant: UserDto
  status: string
  contributionAreas: string[]
  message: string | null
  relevantSkills: string[]
  relevantExperience: ExperienceDto[]
  relevantProjects: ProjectDto[]
  createdAt: string
  reviewedAt: string | null
}

function mapIdeaInterest(dto: IdeaInterestDto): IdeaInterest {
  return {
    id: dto.id,
    ideaId: dto.ideaId,
    ideaTitle: dto.ideaTitle,
    applicant: mapUser(dto.applicant),
    status: dto.status as IdeaInterest['status'],
    contributionAreas: dto.contributionAreas as ContributionArea[],
    message: dto.message ?? undefined,
    relevantSkills: dto.relevantSkills,
    relevantExperience: dto.relevantExperience.map(mapExperience),
    relevantProjects: dto.relevantProjects.map(mapProject),
    createdAt: dto.createdAt,
    reviewedAt: dto.reviewedAt ?? undefined,
  }
}

interface IdeaMembersDto {
  team: { id: string; name: string; avatarUrl: string | null; headline: string | null }[]
  interests: IdeaInterestDto[]
}

export interface IdeaMembers {
  team: { id: string; name: string; avatarUrl: string; headline: string }[]
  interests: IdeaInterest[]
}

export async function getIdeaMembers(ideaId: string): Promise<IdeaMembers> {
  const dto = await apiClient.get<IdeaMembersDto>(`/ideas/${ideaId}/members`)
  return {
    team: dto.team.map((u) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl ?? '', headline: u.headline ?? '' })),
    interests: dto.interests.map(mapIdeaInterest),
  }
}

export async function expressInterest(ideaId: string, input: ExpressInterestInput): Promise<IdeaInterest> {
  const dto = await apiClient.post<IdeaInterestDto>(`/ideas/${ideaId}/interest`, input)
  return mapIdeaInterest(dto)
}

export async function withdrawInterest(ideaId: string): Promise<void> {
  await apiClient.post(`/ideas/${ideaId}/interest/withdraw`)
}

export async function shortlistInterest(interestId: string): Promise<IdeaInterest> {
  const dto = await apiClient.post<IdeaInterestDto>(`/ideas/interests/${interestId}/shortlist`)
  return mapIdeaInterest(dto)
}

export async function rejectInterest(interestId: string): Promise<IdeaInterest> {
  const dto = await apiClient.post<IdeaInterestDto>(`/ideas/interests/${interestId}/reject`)
  return mapIdeaInterest(dto)
}

export async function addToTeam(ideaId: string, userId: string): Promise<Idea> {
  const dto = await apiClient.post<IdeaDto>(`/ideas/${ideaId}/team/${userId}`)
  return mapIdea(dto)
}

export async function removeFromTeam(ideaId: string, userId: string): Promise<Idea> {
  const dto = await apiClient.delete<IdeaDto>(`/ideas/${ideaId}/team/${userId}`)
  return mapIdea(dto)
}

export async function turnIntoStartup(ideaId: string): Promise<Idea> {
  await apiClient.post(`/ideas/${ideaId}/convert-to-startup`, {})
  const idea = await getIdea(ideaId)
  if (!idea) throw new Error('Idea not found')
  return idea
}

interface IdeaMatchDto {
  idea: IdeaDto
  score: number
  matchLabel: string
  reasons: string[]
}

function mapIdeaMatch(dto: IdeaMatchDto): IdeaMatch {
  return { idea: mapIdea(dto.idea), score: dto.score, matchLabel: dto.matchLabel as MatchLabel, reasons: dto.reasons }
}

export async function listRecommendedIdeas(limit = 10): Promise<IdeaMatch[]> {
  const dtos = await apiClient.get<IdeaMatchDto[]>(`/ideas/recommended?limit=${limit}`)
  return dtos.map(mapIdeaMatch)
}

export async function getIdeaMatch(ideaId: string): Promise<IdeaMatch | undefined> {
  try {
    return mapIdeaMatch(await apiClient.get<IdeaMatchDto>(`/ideas/${ideaId}/match`))
  } catch {
    return undefined
  }
}
