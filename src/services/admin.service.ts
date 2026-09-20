import { apiClient, getPagedResult, uploadFile, type Page } from '@/lib/api-client'
import { mapResource, type ResourceDto } from '@/services/resources.service'
import type { AccountStatus, AdminActivity, AdminAuditLog, AdminDashboard, AdminReport, AdminUser, ModerationStatus, ReportStatus } from '@/types/admin'
import type { Resource, ResourceCategory, ResourceType } from '@/types'

export interface AdminUserFilters {
  q?: string
  role?: string
  status?: AccountStatus
  page?: number
  size?: number
}

export async function listAdminUsers(filters: AdminUserFilters = {}): Promise<Page<AdminUser>> {
  return getPagedResult<AdminUser>('/admin/users', { ...filters })
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  return apiClient.get<AdminUser>(`/admin/users/${id}`)
}

export async function updateUserStatus(id: string, status: AccountStatus, reason?: string): Promise<AdminUser> {
  return apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { status, reason })
}

export async function updateUserRole(id: string, role: string, grant: boolean): Promise<AdminUser> {
  return apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role, grant })
}

export interface AdminReportFilters {
  status?: ReportStatus
  category?: string
  page?: number
  size?: number
}

export async function listAdminReports(filters: AdminReportFilters = {}): Promise<Page<AdminReport>> {
  return getPagedResult<AdminReport>('/admin/reports', { ...filters })
}

export async function getAdminReport(id: string): Promise<AdminReport> {
  return apiClient.get<AdminReport>(`/admin/reports/${id}`)
}

export async function resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED', resolutionNote?: string): Promise<AdminReport> {
  return apiClient.patch<AdminReport>(`/admin/reports/${id}`, { status, resolutionNote })
}

export async function listAdminActivity(limit = 50): Promise<AdminActivity[]> {
  return apiClient.get<AdminActivity[]>(`/admin/activity?limit=${limit}`)
}

export interface AdminAuditLogFilters {
  actorId?: string
  action?: string
  entityType?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export async function listAuditLogs(filters: AdminAuditLogFilters = {}): Promise<Page<AdminAuditLog>> {
  return getPagedResult<AdminAuditLog>('/admin/audit-logs', { ...filters })
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return apiClient.get<AdminDashboard>('/admin/dashboard')
}

export interface AdminIdeaRow {
  id: string
  title: string
  stage: string
  category: string | null
  creatorId: string
  startupId: string | null
  interestCount: number
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: ModerationStatus
  rejectionReason: string | null
  createdAt: string
}

export async function listAdminIdeas(
  params: { q?: string; includeRemoved?: boolean; status?: ModerationStatus; page?: number; size?: number } = {},
): Promise<Page<AdminIdeaRow>> {
  return getPagedResult<AdminIdeaRow>('/admin/ideas', { ...params })
}

export async function setIdeaRemoved(id: string, removed: boolean, reason?: string): Promise<AdminIdeaRow> {
  return apiClient.patch<AdminIdeaRow>(`/admin/ideas/${id}/removed`, { removed, reason })
}

export async function reviewIdeaModeration(id: string, approved: boolean, reason?: string): Promise<AdminIdeaRow> {
  return apiClient.patch<AdminIdeaRow>(`/admin/ideas/${id}/moderation`, { approved, reason })
}

export interface AdminStartupRow {
  id: string
  name: string
  sector: string | null
  stage: string
  visibility: string
  isRaising: boolean
  chapterId: string | null
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: ModerationStatus
  rejectionReason: string | null
  createdAt: string
}

export async function listAdminStartups(
  params: { q?: string; includeRemoved?: boolean; status?: ModerationStatus; page?: number; size?: number } = {},
): Promise<Page<AdminStartupRow>> {
  return getPagedResult<AdminStartupRow>('/admin/startups', { ...params })
}

export async function setStartupRemoved(id: string, removed: boolean, reason?: string): Promise<AdminStartupRow> {
  return apiClient.patch<AdminStartupRow>(`/admin/startups/${id}/removed`, { removed, reason })
}

export async function reviewStartupModeration(id: string, approved: boolean, reason?: string): Promise<AdminStartupRow> {
  return apiClient.patch<AdminStartupRow>(`/admin/startups/${id}/moderation`, { approved, reason })
}

export interface AdminOpportunityRow {
  id: string
  title: string
  type: string
  closed: boolean
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: ModerationStatus
  rejectionReason: string | null
  organizationName: string
  postedByUserId: string
  applicantCount: number
  createdAt: string
}

export async function listAdminOpportunities(
  params: { q?: string; includeClosed?: boolean; includeRemoved?: boolean; status?: ModerationStatus; page?: number; size?: number } = {},
): Promise<Page<AdminOpportunityRow>> {
  return getPagedResult<AdminOpportunityRow>('/admin/opportunities', { ...params })
}

export async function setOpportunityRemoved(id: string, removed: boolean, reason?: string): Promise<AdminOpportunityRow> {
  return apiClient.patch<AdminOpportunityRow>(`/admin/opportunities/${id}/removed`, { removed, reason })
}

export async function reviewOpportunityModeration(id: string, approved: boolean, reason?: string): Promise<AdminOpportunityRow> {
  return apiClient.patch<AdminOpportunityRow>(`/admin/opportunities/${id}/moderation`, { approved, reason })
}

export interface AdminGrantRow {
  id: string
  name: string
  provider: string
  providerType: string
  applicationUrl: string
  createdByUserId: string
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: ModerationStatus
  rejectionReason: string | null
  createdAt: string
}

export async function listAdminGrants(
  params: { q?: string; includeRemoved?: boolean; status?: ModerationStatus; page?: number; size?: number } = {},
): Promise<Page<AdminGrantRow>> {
  return getPagedResult<AdminGrantRow>('/admin/grants', { ...params })
}

export async function setGrantRemoved(id: string, removed: boolean, reason?: string): Promise<AdminGrantRow> {
  return apiClient.patch<AdminGrantRow>(`/admin/grants/${id}/removed`, { removed, reason })
}

export async function reviewGrantModeration(id: string, approved: boolean, reason?: string): Promise<AdminGrantRow> {
  return apiClient.patch<AdminGrantRow>(`/admin/grants/${id}/moderation`, { approved, reason })
}

export interface AdminPostRow {
  id: string
  authorId: string
  type: string
  content: string
  likesCount: number
  commentsCount: number
  removedByAdmin: boolean
  removalReason: string | null
  createdAt: string
}

export async function listAdminPosts(
  params: { includeRemoved?: boolean; page?: number; size?: number } = {},
): Promise<Page<AdminPostRow>> {
  return getPagedResult<AdminPostRow>('/admin/feed/posts', { ...params })
}

export async function getAdminPost(id: string): Promise<AdminPostRow> {
  return apiClient.get<AdminPostRow>(`/admin/feed/posts/${id}`)
}

export async function setPostRemoved(id: string, removed: boolean, reason?: string): Promise<AdminPostRow> {
  return apiClient.patch<AdminPostRow>(`/admin/feed/posts/${id}/removed`, { removed, reason })
}

export interface AdminInvestorActivationRow {
  id: string
  requesterUserId: string
  requesterName: string | null
  requesterEmail: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
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
  reviewedBy: string | null
  createdAt: string
  reviewedAt: string | null
}

export async function listAdminInvestorActivations(
  params: { status?: string; page?: number; size?: number } = {},
): Promise<Page<AdminInvestorActivationRow>> {
  return getPagedResult<AdminInvestorActivationRow>('/admin/investor-activation-requests', { ...params })
}

export async function approveInvestorActivation(id: string): Promise<AdminInvestorActivationRow> {
  return apiClient.patch<AdminInvestorActivationRow>(`/admin/investor-activation-requests/${id}/approve`, {})
}

export async function rejectInvestorActivation(id: string, reason: string): Promise<AdminInvestorActivationRow> {
  return apiClient.patch<AdminInvestorActivationRow>(`/admin/investor-activation-requests/${id}/reject`, { reason })
}

// ---- Resource library (admin-curated: this is the ONLY place resources are created, edited or deleted) ----

export async function listAdminResources(
  params: { q?: string; type?: ResourceType; category?: ResourceCategory; chapterId?: string; page?: number; size?: number } = {},
): Promise<Page<Resource>> {
  const result = await getPagedResult<ResourceDto>('/admin/resources', { ...params })
  return { ...result, content: result.content.map(mapResource) }
}

export interface AdminCreateResourceInput {
  title: string
  description?: string
  type: ResourceType
  category?: ResourceCategory
  provider?: string
  durationMinutes?: number
  featured?: boolean
  /** Exactly one of `url` / `file` — the server rejects both or neither. */
  url?: string
  file?: File
  /** An optional card image (PNG, JPEG, WEBP or GIF). */
  thumbnail?: File
  chapterId?: string
  tags: string[]
}

export async function createAdminResource(input: AdminCreateResourceInput): Promise<Resource> {
  const dto = await uploadFile<ResourceDto>(
    '/admin/resources',
    input.file ?? null,
    'file',
    {
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      provider: input.provider,
      durationMinutes: input.durationMinutes ? String(input.durationMinutes) : undefined,
      featured: input.featured ? 'true' : undefined,
      url: input.url,
      chapterId: input.chapterId,
      tags: input.tags.join(','),
    },
    'POST',
    { thumbnail: input.thumbnail },
  )
  return mapResource(dto)
}

export interface AdminUpdateResourceInput {
  title?: string
  description?: string
  type?: ResourceType
  /** Pass '' to take it off its shelf; omit to leave unchanged. */
  category?: ResourceCategory | ''
  /** Pass '' to clear; omit to leave unchanged. */
  provider?: string
  /** Pass 0 to clear; omit to leave unchanged. */
  durationMinutes?: number
  featured?: boolean
  url?: string
  /** Pass '' to unassign from any chapter; omit to leave unchanged. */
  chapterId?: string
  tags?: string[]
}

export async function updateAdminResource(id: string, input: AdminUpdateResourceInput): Promise<Resource> {
  return mapResource(await apiClient.put<ResourceDto>(`/admin/resources/${id}`, input))
}

/** Sets or replaces the card image of an existing resource. */
export async function replaceAdminResourceThumbnail(id: string, image: File): Promise<Resource> {
  return mapResource(await uploadFile<ResourceDto>(`/admin/resources/${id}/thumbnail`, image, 'image'))
}

export async function removeAdminResourceThumbnail(id: string): Promise<Resource> {
  return mapResource(await apiClient.delete<ResourceDto>(`/admin/resources/${id}/thumbnail`))
}

/** Chapters a resource can be scoped to. The admin token can't call the member chapters API, so this has its own endpoint. */
export async function listAdminResourceChapters(): Promise<{ id: string; name: string }[]> {
  return apiClient.get<{ id: string; name: string }[]>('/admin/resources/chapter-options')
}

export async function deleteAdminResource(id: string): Promise<void> {
  await apiClient.delete(`/admin/resources/${id}`)
}
