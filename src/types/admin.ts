export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED'
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  headline: string | null
  collegeOrCompany: string | null
  location: string | null
  roles: string[]
  status: AccountStatus
  emailVerified: boolean
  onboardingCompleted: boolean
  googleLinked: boolean
  connectionsCount: number
  createdAt: string
  lastActiveAt: string | null
}

export interface AdminReport {
  id: string
  reporterId: string
  reporterName: string | null
  reportedUserId: string
  reportedUserName: string | null
  category: string
  conversationId: string | null
  postId: string | null
  status: ReportStatus
  createdAt: string
  resolvedByUserId: string | null
  resolvedByName: string | null
  resolvedAt: string | null
  resolutionNote: string | null
}

export interface AdminMessage {
  id: string
  senderId: string
  messageType: string
  content: string | null
  unsent: boolean
  createdAt: string
}

export interface AdminAuditLog {
  id: string
  actorId: string | null
  actorName: string | null
  action: string
  entityType: string | null
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

export interface AdminDashboard {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  disabledUsers: number
  founders: number
  investors: number
  chapterPresidents: number
  admins: number
  totalStartups: number
  totalIdeas: number
  totalOpportunities: number
  openOpportunities: number
  pendingReports: number
  pendingModeration: number
  pendingWithdrawals: number
  pendingInvestorActivations: number
  recentActivity: AdminAuditLog[]
}
