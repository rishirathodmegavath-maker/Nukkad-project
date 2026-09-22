import { apiClient, getPagedResult, uploadFile, type Page } from '@/lib/api-client'
import { mapResource, type ResourceDto } from '@/services/resources.service'
import type { AttachmentRef } from '@/services/feed.service'
import type { AccountStatus, AdminActivity, AdminAuditLog, AdminDashboard, AdminReport, AdminUser, ModerationStatus, ReportStatus } from '@/types/admin'
import type {
  GrantProviderType,
  InvestorType,
  OpportunityType,
  PostType,
  PostVisibility,
  Resource,
  ResourceCategory,
  ResourceType,
  StartupVisibility,
  WorkMode,
} from '@/types'

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

export interface AdminCreateStartupInput {
  name: string
  tagline?: string
  sector?: string
  stage: string
  problem?: string
  solution?: string
  needs: string[]
  chapterId?: string
  location?: string
  website?: string
  targetCustomer?: string
  businessModel?: string
  whatBuilding?: string
  revenue?: string
  customers?: string
  users?: string
  growth?: string
  otherTraction?: string
  visibility?: StartupVisibility
  fundraisingVisible?: boolean
  /** A member to make the founder. Without it the admin's own account owns the startup. */
  founderEmail?: string
}

/** Adds a startup from the admin panel — every field a member can set when registering their own is
 *  available here too. It is live at once, like one a member registers. The logo (if any) is a
 *  separate call once the startup exists (uploadAdminStartupLogo), same shape as the member flow. */
export async function createAdminStartup(input: AdminCreateStartupInput): Promise<AdminStartupRow> {
  return apiClient.post<AdminStartupRow>('/admin/startups', {
    ...input,
    tagline: input.tagline || undefined,
    sector: input.sector || undefined,
    problem: input.problem || undefined,
    solution: input.solution || undefined,
    chapterId: input.chapterId || undefined,
    location: input.location || undefined,
    website: input.website || undefined,
    targetCustomer: input.targetCustomer || undefined,
    businessModel: input.businessModel || undefined,
    whatBuilding: input.whatBuilding || undefined,
    revenue: input.revenue || undefined,
    customers: input.customers || undefined,
    users: input.users || undefined,
    growth: input.growth || undefined,
    otherTraction: input.otherTraction || undefined,
    founderEmail: input.founderEmail || undefined,
  })
}

/** The startup's logo — a separate call after createAdminStartup, exactly like the member create-startup flow
 *  (create, then upload). Never blocked by "must manage this startup," unlike the member logo endpoint. */
export async function uploadAdminStartupLogo(id: string, file: File): Promise<AdminStartupRow> {
  return uploadFile<AdminStartupRow>(`/admin/startups/${id}/logo`, file)
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

export interface AdminPostOpportunityInput {
  title: string
  type: OpportunityType
  organizationName: string
  location?: string
  workMode: WorkMode
  description: string
  responsibilities?: string
  requirements?: string[]
  requiredSkills?: string[]
  compensation?: string
  equity?: string
  experienceLevel?: string
  applicationDeadline?: string
  /** A member to attribute the posting to. Without it the admin's own account is the poster. */
  postedByEmail?: string
}

/** Posts an opportunity from the admin panel. It's live at once, not sent through the pending-review
 *  queue a member's own posting enters — and it's never attributed to a specific BuildAdda startup. */
export async function createAdminOpportunity(input: AdminPostOpportunityInput): Promise<AdminOpportunityRow> {
  return apiClient.post<AdminOpportunityRow>('/admin/opportunities', {
    ...input,
    location: input.location || undefined,
    responsibilities: input.responsibilities || undefined,
    compensation: input.compensation || undefined,
    equity: input.equity || undefined,
    experienceLevel: input.experienceLevel || undefined,
    applicationDeadline: input.applicationDeadline || undefined,
    postedByEmail: input.postedByEmail || undefined,
  })
}

export interface AdminGrantRow {
  id: string
  name: string
  provider: string
  providerType: string
  applicationUrl: string
  /** Official page the details were verified against — set on every AI-discovered grant, rarely on a manually-entered one. */
  sourceUrl: string | null
  /** "Manual" (a person entered it) or "AI Discovery" (the scheduled pipeline auto-published it) — see com.nukkad.grant.discovery. */
  discoveryOrigin: 'Manual' | 'AI Discovery'
  /** Last time the discovery pipeline re-confirmed an AI-discovered grant is still live. Null for a manually-entered grant. */
  lastVerifiedAt: string | null
  createdByUserId: string
  removedByAdmin: boolean
  removalReason: string | null
  moderationStatus: ModerationStatus
  rejectionReason: string | null
  createdAt: string
}

export interface GrantDiscoveryRun {
  id: string
  batchGovernment: string
  batchTopic: string
  status: 'SUCCESS' | 'FAILED'
  schemesFound: number
  schemesCreated: number
  schemesUpdated: number
  schemesRejected: number
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}

/** Read-only run history for the scheduled AI grant-discovery pipeline — see AdminGrantDiscoveryController.
 *  There is no "run now" endpoint; the pipeline is schedule-only by design. */
export async function listGrantDiscoveryRuns(params: { page?: number; size?: number } = {}): Promise<Page<GrantDiscoveryRun>> {
  return getPagedResult<GrantDiscoveryRun>('/admin/grant-discovery/runs', { ...params })
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

export interface AdminCreateGrantInput {
  name: string
  provider: string
  providerType: GrantProviderType
  description?: string
  fundingAmount?: string
  eligibilityCriteria?: string
  eligibleSectors?: string[]
  eligibleStages?: string[]
  deadline?: string
  applicationUrl: string
  /** A member to attribute the listing to. Without it the admin's own account is the creator. */
  createdByEmail?: string
}

/** Publishes a grant listing from the admin panel. It's live at once, not sent through the
 *  pending-review queue a member's own submission enters. */
export async function createAdminGrant(input: AdminCreateGrantInput): Promise<AdminGrantRow> {
  return apiClient.post<AdminGrantRow>('/admin/grants', {
    ...input,
    description: input.description || undefined,
    fundingAmount: input.fundingAmount || undefined,
    eligibilityCriteria: input.eligibilityCriteria || undefined,
    deadline: input.deadline || undefined,
    createdByEmail: input.createdByEmail || undefined,
  })
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
  visibility?: string
  linkUrl?: string | null
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

/** Same upload the member composer uses, just reachable with an admin-scoped token. */
export async function uploadAdminPostAttachment(file: File): Promise<AttachmentRef> {
  return uploadFile<AttachmentRef>('/admin/feed/posts/attachments', file)
}

export interface AdminCreatePostInput {
  content: string
  type?: PostType
  attachments?: AttachmentRef[]
  visibility?: PostVisibility
  linkUrl?: string
  /** A member to make the author. Without it the admin's own account is the author. */
  authorEmail?: string
}

/** Publishes a post from the admin panel. It's live at once, like one a member writes themselves. */
export async function createAdminPost(input: AdminCreatePostInput): Promise<AdminPostRow> {
  return apiClient.post<AdminPostRow>('/admin/feed/posts', {
    content: input.content,
    type: input.type ?? 'text',
    attachments: input.attachments ?? [],
    visibility: input.visibility ?? 'PUBLIC',
    linkUrl: input.linkUrl || undefined,
    authorEmail: input.authorEmail || undefined,
  })
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

/** All-or-nothing on the backend: if any id doesn't exist, none of them are deleted. `apiClient.delete`
 *  takes no body, so the ids go in the query string — same approach as messages.service.ts's
 *  hideMessagesForMe. */
export async function bulkDeleteAdminResources(ids: string[]): Promise<void> {
  const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join('&')
  await apiClient.delete(`/admin/resources?${query}`)
}

// ---- Investor Discovery catalog (admin-managed: this is the ONLY place these are created, edited or retired —
//      see the Investor entity's class comment for how this relates to self-serve Investor Applications above) ----

export interface AdminInvestorRow {
  id: string
  externalSourceId: string | null
  name: string
  investorType: InvestorType
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
  active: boolean
  visible: boolean
  contactEmail: string | null
  contactEmailVerified: boolean | null
  secondaryEmail: string | null
  phoneNumber: string | null
  linkedInvestorProfileId: string | null
  linkedInvestorProfileName: string | null
  createdByAdminId: string
  createdAt: string
  updatedAt: string
}

export async function listAdminInvestors(
  params: { q?: string; type?: InvestorType; active?: boolean; visible?: boolean; page?: number; size?: number } = {},
): Promise<Page<AdminInvestorRow>> {
  return getPagedResult<AdminInvestorRow>('/admin/investor-catalog', { ...params })
}

export async function getAdminInvestor(id: string): Promise<AdminInvestorRow> {
  return apiClient.get<AdminInvestorRow>(`/admin/investor-catalog/${id}`)
}

export interface AdminCreateInvestorInput {
  name: string
  investorType: InvestorType
  description?: string
  location?: string
  country?: string
  website?: string
  domain?: string
  sectors: string[]
  stages: string[]
  programs: string[]
  keyPeople: string[]
  investmentCount?: number
  exitCount?: number
  chequeMin?: number
  chequeMax?: number
  active: boolean
  visible: boolean
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  contactEmail?: string
  contactEmailVerified?: boolean
  secondaryEmail?: string
  phoneNumber?: string
  /** Ties this catalog row to a real, activated investor account — see Investor Applications. Optional; most
   *  catalog investors (firms that aren't BuildAdda users) leave this unset. */
  linkedInvestorProfileId?: string
  logo?: File
}

export async function createAdminInvestor(input: AdminCreateInvestorInput): Promise<AdminInvestorRow> {
  return uploadFile<AdminInvestorRow>(
    '/admin/investor-catalog',
    input.logo ?? null,
    'logo',
    {
      name: input.name,
      investorType: input.investorType,
      description: input.description,
      location: input.location,
      country: input.country,
      website: input.website,
      domain: input.domain,
      sectors: input.sectors.length ? input.sectors.join(',') : undefined,
      stages: input.stages.length ? input.stages.join(',') : undefined,
      programs: input.programs.length ? input.programs.join(',') : undefined,
      keyPeople: input.keyPeople.length ? input.keyPeople.join(',') : undefined,
      investmentCount: input.investmentCount !== undefined ? String(input.investmentCount) : undefined,
      exitCount: input.exitCount !== undefined ? String(input.exitCount) : undefined,
      chequeMin: input.chequeMin !== undefined ? String(input.chequeMin) : undefined,
      chequeMax: input.chequeMax !== undefined ? String(input.chequeMax) : undefined,
      active: String(input.active),
      visible: String(input.visible),
      facebookUrl: input.facebookUrl,
      instagramUrl: input.instagramUrl,
      linkedinUrl: input.linkedinUrl,
      twitterUrl: input.twitterUrl,
      contactEmail: input.contactEmail,
      contactEmailVerified: input.contactEmailVerified !== undefined ? String(input.contactEmailVerified) : undefined,
      secondaryEmail: input.secondaryEmail,
      phoneNumber: input.phoneNumber,
      linkedInvestorProfileId: input.linkedInvestorProfileId,
    },
    'POST',
  )
}

export interface AdminUpdateInvestorInput {
  name?: string
  investorType?: InvestorType
  /** Pass '' to clear; omit to leave unchanged. */
  description?: string
  location?: string
  country?: string
  website?: string
  domain?: string
  sectors?: string[]
  stages?: string[]
  programs?: string[]
  keyPeople?: string[]
  investmentCount?: number
  exitCount?: number
  chequeMin?: number
  chequeMax?: number
  active?: boolean
  visible?: boolean
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  contactEmail?: string
  contactEmailVerified?: boolean
  secondaryEmail?: string
  phoneNumber?: string
  /** Pass '' to unlink; omit to leave unchanged. */
  linkedInvestorProfileId?: string
}

export async function updateAdminInvestor(id: string, input: AdminUpdateInvestorInput): Promise<AdminInvestorRow> {
  return apiClient.put<AdminInvestorRow>(`/admin/investor-catalog/${id}`, input)
}

export async function replaceAdminInvestorLogo(id: string, logo: File): Promise<AdminInvestorRow> {
  return uploadFile<AdminInvestorRow>(`/admin/investor-catalog/${id}/logo`, logo, 'logo')
}

export async function removeAdminInvestorLogo(id: string): Promise<AdminInvestorRow> {
  return apiClient.delete<AdminInvestorRow>(`/admin/investor-catalog/${id}/logo`)
}

export async function deleteAdminInvestor(id: string): Promise<void> {
  await apiClient.delete(`/admin/investor-catalog/${id}`)
}

/** All-or-nothing on the backend: if any id doesn't exist, none of them are deleted. */
export async function bulkDeleteAdminInvestors(ids: string[]): Promise<void> {
  const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join('&')
  await apiClient.delete(`/admin/investor-catalog?${query}`)
}

export interface AdminInvestorIntroductionRow {
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
}

export async function listAdminInvestorIntroductions(
  params: { status?: 'PENDING' | 'CLOSED'; page?: number; size?: number } = {},
): Promise<Page<AdminInvestorIntroductionRow>> {
  return getPagedResult<AdminInvestorIntroductionRow>('/admin/investor-catalog/introductions', { ...params })
}

export async function closeAdminInvestorIntroduction(id: string): Promise<AdminInvestorIntroductionRow> {
  return apiClient.patch<AdminInvestorIntroductionRow>(`/admin/investor-catalog/introductions/${id}/close`, {})
}

// ---- Investor catalog bulk CSV import — see InvestorImportService on the backend ----

export interface AdminInvestorImportPreviewRow {
  rowNumber: number
  externalSourceId: string | null
  name: string | null
  investorType: string | null
  location: string | null
  country: string | null
  warnings: string[]
  error: string | null
}

export interface AdminInvestorImportPreview {
  totalRows: number
  detectedColumns: string[]
  unrecognizedColumns: string[]
  hasIdColumn: boolean
  /** Set only for a multi-sheet Excel upload — only the first sheet is ever imported. */
  note: string | null
  sampleRows: AdminInvestorImportPreviewRow[]
}

export async function previewAdminInvestorImport(file: File): Promise<AdminInvestorImportPreview> {
  return uploadFile<AdminInvestorImportPreview>('/admin/investor-catalog/import/preview', file, 'file')
}

export type AdminInvestorImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AdminInvestorImportBatch {
  id: string
  originalFilename: string | null
  status: AdminInvestorImportStatus
  totalRows: number
  processedRows: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  failedCount: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export async function startAdminInvestorImport(file: File): Promise<AdminInvestorImportBatch> {
  return uploadFile<AdminInvestorImportBatch>('/admin/investor-catalog/import', file, 'file')
}

export async function listAdminInvestorImports(params: { page?: number; size?: number } = {}): Promise<Page<AdminInvestorImportBatch>> {
  return getPagedResult<AdminInvestorImportBatch>('/admin/investor-catalog/import', { ...params })
}

export async function getAdminInvestorImport(id: string): Promise<AdminInvestorImportBatch> {
  return apiClient.get<AdminInvestorImportBatch>(`/admin/investor-catalog/import/${id}`)
}

export interface AdminInvestorImportIssue {
  id: string
  rowNumber: number
  externalSourceId: string | null
  investorName: string | null
  severity: 'WARNING' | 'ERROR'
  message: string
  createdAt: string
}

export async function listAdminInvestorImportIssues(
  batchId: string,
  params: { page?: number; size?: number } = {},
): Promise<Page<AdminInvestorImportIssue>> {
  return getPagedResult<AdminInvestorImportIssue>(`/admin/investor-catalog/import/${batchId}/issues`, { ...params })
}
