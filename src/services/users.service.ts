import { apiClient, getPage, uploadFile } from '@/lib/api-client'
import { getStoredSession } from '@/lib/session'
import type {
  Achievement,
  Availability,
  Certification,
  ConnectionStatus,
  Education,
  EndorsementSummary,
  Experience,
  LookingFor,
  OpenTo,
  ProjectType,
  Publication,
  Recommendation,
  SocialPlatform,
  User,
  UserProject,
} from '@/types'

export interface UserFilters {
  query?: string
  skill?: string
  collegeOrCompany?: string
  location?: string
  role?: string
  lookingFor?: LookingFor
  minExperience?: number
  chapterId?: string
  size?: number
}

export interface ExperienceDto {
  id: string
  company: string
  role: string
  employmentType: string | null
  location: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string | null
  companyUrl: string | null
  sortOrder: number
}

interface EducationDto {
  id: string
  institution: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
  grade: string | null
  description: string | null
  sortOrder: number
}

interface AchievementDto {
  id: string
  title: string
  organization: string | null
  achievedOn: string | null
  description: string | null
  credentialUrl: string | null
  sortOrder: number
}

interface CertificationDto {
  id: string
  title: string
  issuingOrg: string | null
  issueDate: string | null
  expiryDate: string | null
  credentialId: string | null
  credentialUrl: string | null
  sortOrder: number
}

export interface ProjectDto {
  id: string
  title: string
  description: string | null
  technologies: string[]
  imageUrl: string | null
  githubUrl: string | null
  liveUrl: string | null
  startDate: string | null
  endDate: string | null
  projectType: string
  sortOrder: number
}

interface PublicationDto {
  id: string
  title: string
  publisher: string | null
  publishDate: string | null
  description: string | null
  url: string | null
  sortOrder: number
}

interface RecommendationDto {
  id: string
  authorUserId: string
  authorName: string
  authorAvatarUrl: string | null
  authorHeadline: string | null
  relationship: string | null
  body: string
  status: string
  createdAt: string
  respondedAt: string | null
}

export interface UserDto {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  coverUrl: string | null
  headline: string | null
  role: string | null
  collegeOrCompany: string | null
  location: string | null
  experienceYears: number
  skills: string[]
  lookingFor: string[]
  openTo: string[]
  socialLinks: Record<string, string>
  goals: string | null
  bio: string | null
  availability: string | null
  chapterId: string | null
  connectionsCount: number
  isOnline: boolean
  createdAt: string
  connectionStatus: ConnectionStatus | null
  isFollowing: boolean | null
  googleLinked: boolean
  experiences: ExperienceDto[]
  education: EducationDto[]
  achievements: AchievementDto[]
  projects: ProjectDto[]
  certifications: CertificationDto[]
  publications: PublicationDto[]
  profileCompleteness: number | null
  endorsementSummary: EndorsementSummary[]
  recommendations: RecommendationDto[]
  roles: string[]
}

export function mapExperience(dto: ExperienceDto): Experience {
  return {
    id: dto.id,
    company: dto.company,
    role: dto.role,
    employmentType: dto.employmentType ?? undefined,
    location: dto.location ?? undefined,
    startDate: dto.startDate,
    endDate: dto.endDate ?? undefined,
    isCurrent: dto.isCurrent,
    description: dto.description ?? undefined,
    companyUrl: dto.companyUrl ?? undefined,
    sortOrder: dto.sortOrder,
  }
}

function mapEducation(dto: EducationDto): Education {
  return {
    id: dto.id,
    institution: dto.institution,
    degree: dto.degree ?? undefined,
    fieldOfStudy: dto.fieldOfStudy ?? undefined,
    startYear: dto.startYear ?? undefined,
    endYear: dto.endYear ?? undefined,
    grade: dto.grade ?? undefined,
    description: dto.description ?? undefined,
    sortOrder: dto.sortOrder,
  }
}

function mapAchievement(dto: AchievementDto): Achievement {
  return {
    id: dto.id,
    title: dto.title,
    organization: dto.organization ?? undefined,
    achievedOn: dto.achievedOn ?? undefined,
    description: dto.description ?? undefined,
    credentialUrl: dto.credentialUrl ?? undefined,
    sortOrder: dto.sortOrder,
  }
}

function mapCertification(dto: CertificationDto): Certification {
  return {
    id: dto.id,
    title: dto.title,
    issuingOrg: dto.issuingOrg ?? undefined,
    issueDate: dto.issueDate ?? undefined,
    expiryDate: dto.expiryDate ?? undefined,
    credentialId: dto.credentialId ?? undefined,
    credentialUrl: dto.credentialUrl ?? undefined,
    sortOrder: dto.sortOrder,
  }
}

export function mapProject(dto: ProjectDto): UserProject {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? '',
    technologies: dto.technologies,
    imageUrl: dto.imageUrl ?? undefined,
    githubUrl: dto.githubUrl ?? undefined,
    liveUrl: dto.liveUrl ?? undefined,
    startDate: dto.startDate ?? undefined,
    endDate: dto.endDate ?? undefined,
    projectType: dto.projectType as ProjectType,
    sortOrder: dto.sortOrder,
  }
}

function mapPublication(dto: PublicationDto): Publication {
  return {
    id: dto.id,
    title: dto.title,
    publisher: dto.publisher ?? undefined,
    publishDate: dto.publishDate ?? undefined,
    description: dto.description ?? undefined,
    url: dto.url ?? undefined,
    sortOrder: dto.sortOrder,
  }
}

function mapRecommendation(dto: RecommendationDto): Recommendation {
  return {
    id: dto.id,
    authorUserId: dto.authorUserId,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl ?? undefined,
    authorHeadline: dto.authorHeadline ?? undefined,
    relationship: dto.relationship ?? undefined,
    body: dto.body,
    status: dto.status as Recommendation['status'],
    createdAt: dto.createdAt,
    respondedAt: dto.respondedAt ?? undefined,
  }
}

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    avatarUrl: dto.avatarUrl ?? '',
    coverUrl: dto.coverUrl ?? undefined,
    headline: dto.headline ?? '',
    role: dto.role ?? '',
    collegeOrCompany: dto.collegeOrCompany ?? '',
    location: dto.location ?? '',
    experienceYears: dto.experienceYears,
    skills: dto.skills,
    lookingFor: dto.lookingFor as LookingFor[],
    openTo: dto.openTo as OpenTo[],
    socialLinks: dto.socialLinks as Partial<Record<SocialPlatform, string>>,
    goals: dto.goals ?? '',
    bio: dto.bio ?? '',
    availability: (dto.availability ?? 'Not available') as Availability,
    projects: dto.projects.map(mapProject),
    experiences: dto.experiences.map(mapExperience),
    education: dto.education.map(mapEducation),
    achievements: dto.achievements.map(mapAchievement),
    certifications: dto.certifications.map(mapCertification),
    publications: dto.publications.map(mapPublication),
    profileCompleteness: dto.profileCompleteness ?? undefined,
    endorsementSummary: dto.endorsementSummary,
    recommendations: dto.recommendations.map(mapRecommendation),
    // Not yet exposed by the backend (no startup-membership lookup on User) — use
    // `listStartups({ memberId: user.id })` instead, which is real.
    startupIds: [],
    chapterId: dto.chapterId ?? undefined,
    connectionsCount: dto.connectionsCount,
    connectionStatus: dto.connectionStatus ?? undefined,
    isFollowing: dto.isFollowing ?? undefined,
    isOnline: dto.isOnline,
    createdAt: dto.createdAt,
    roles: dto.roles ?? [],
    googleLinked: dto.googleLinked,
  }
}

export async function listUsers(filters: UserFilters = {}): Promise<User[]> {
  const dtos = await getPage<UserDto>('/users', {
    q: filters.query,
    skill: filters.skill,
    collegeOrCompany: filters.collegeOrCompany,
    location: filters.location,
    role: filters.role,
    lookingFor: filters.lookingFor,
    minExperience: filters.minExperience,
    chapterId: filters.chapterId,
    size: filters.size,
  })
  return dtos.map(mapUser)
}

export async function getUser(id: string): Promise<User | undefined> {
  try {
    return mapUser(await apiClient.get<UserDto>(`/users/${id}`))
  } catch {
    return undefined
  }
}

export async function getCurrentUser(): Promise<User> {
  return mapUser(await apiClient.get<UserDto>('/users/me'))
}

export async function updateCurrentUser(patch: Partial<User>): Promise<User> {
  const dto = await apiClient.patch<UserDto>('/users/me', {
    name: patch.name,
    avatarUrl: patch.avatarUrl,
    headline: patch.headline,
    role: patch.role,
    collegeOrCompany: patch.collegeOrCompany,
    location: patch.location,
    experienceYears: patch.experienceYears,
    skills: patch.skills,
    lookingFor: patch.lookingFor,
    openTo: patch.openTo,
    socialLinks: patch.socialLinks,
    goals: patch.goals,
    bio: patch.bio,
    availability: patch.availability,
    chapterId: patch.chapterId,
  })
  return mapUser(dto)
}

export async function completeOnboarding(): Promise<User> {
  const dto = await apiClient.post<UserDto>('/users/me/onboarding/complete')
  return mapUser(dto)
}

export async function uploadAvatar(file: File): Promise<User> {
  return mapUser(await uploadFile<UserDto>('/users/me/avatar', file))
}

export async function removeAvatar(): Promise<User> {
  return mapUser(await apiClient.delete<UserDto>('/users/me/avatar'))
}

export async function uploadCoverPhoto(file: File): Promise<User> {
  return mapUser(await uploadFile<UserDto>('/users/me/cover', file))
}

export async function removeCoverPhoto(): Promise<User> {
  return mapUser(await apiClient.delete<UserDto>('/users/me/cover'))
}

export async function toggleConnect(userId: string): Promise<User> {
  await apiClient.post(`/users/${userId}/connect`)
  const updated = await getUser(userId)
  if (!updated) throw new Error('User not found')
  return updated
}

export async function declineConnection(userId: string): Promise<User> {
  await apiClient.post(`/users/${userId}/connect/decline`)
  const updated = await getUser(userId)
  if (!updated) throw new Error('User not found')
  return updated
}

export async function toggleFollow(userId: string): Promise<User> {
  await apiClient.post(`/users/${userId}/follow`)
  const updated = await getUser(userId)
  if (!updated) throw new Error('User not found')
  return updated
}

export async function listUserConnections(userId: string): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>(`/users/${userId}/connections`)
  return dtos.map(mapUser)
}

/** Connection requests the current user has received and hasn't responded to yet. */
export async function listIncomingConnectionRequests(): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>('/users/me/connections/incoming')
  return dtos.map(mapUser)
}

/** Connection requests the current user sent that are still pending. */
export async function listSentConnectionRequests(): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>('/users/me/connections/sent')
  return dtos.map(mapUser)
}

export async function listSuggestedConnections(limit = 4): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>(`/users/suggested?limit=${limit}`)
  return dtos.map(mapUser)
}

export async function blockUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/block`)
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/unblock`)
}

export async function listBlockedUsers(): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>('/users/me/blocked')
  return dtos.map(mapUser)
}

export async function muteUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/mute`)
}

export async function unmuteUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/unmute`)
}

export async function listMutedUsers(): Promise<User[]> {
  const dtos = await apiClient.get<UserDto[]>('/users/me/muted')
  return dtos.map(mapUser)
}

export interface MutualConnections {
  users: User[]
  totalCount: number
}

export async function getMutualConnections(userId: string, limit = 6): Promise<MutualConnections> {
  const result = await apiClient.get<{ users: UserDto[]; totalCount: number }>(
    `/users/${userId}/mutual-connections?limit=${limit}`,
  )
  return { users: result.users.map(mapUser), totalCount: result.totalCount }
}

/** Convenience for pages that still compare against the logged-in user's id directly. */
export function getCurrentUserId(): string | undefined {
  return getStoredSession()?.userId
}
