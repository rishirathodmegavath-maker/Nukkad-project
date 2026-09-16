import type { User } from './user'

export type StartupStage = 'Idea' | 'MVP' | 'Early Traction' | 'Growth' | 'Scaling'

export type StartupMembershipStatus = 'ACTIVE' | 'PENDING' | 'REJECTED'

export type StartupVisibility = 'Public' | 'Nukkad Members'

export type StartupMaterialType =
  | 'Website'
  | 'Pitch Deck'
  | 'Product Demo'
  | 'Screenshots'
  | 'LinkedIn'
  | 'X'
  | 'Other Document'

export interface StartupMaterial {
  id: string
  startupId: string
  materialType: StartupMaterialType
  title?: string
  url: string
  originalFileName?: string
  contentType?: string
  sortOrder: number
  canManage: boolean
  createdAt: string
}

export interface StartupTeamMember {
  id: string
  userId: string
  role: string
  isFounder: boolean
  status: StartupMembershipStatus
  roleId?: string
  reviewedAt?: string
}

export interface StartupJoinRequest {
  id: string
  startupId: string
  startupName: string
  applicant: User
  status: StartupMembershipStatus
  roleId?: string
  roleTitle?: string
  message?: string
  createdAt: string
  reviewedAt?: string
}

export interface UpdateStartupInput {
  name?: string
  logoUrl?: string
  location?: string
  website?: string
  tagline?: string
  sector?: string
  problem?: string
  solution?: string
  targetCustomer?: string
  businessModel?: string
  whatBuilding?: string
  stage?: StartupStage
  traction?: string
  revenue?: string
  customers?: string
  users?: string
  growth?: string
  otherTraction?: string
  keywords?: string
  visibility?: StartupVisibility
  fundraisingVisible?: boolean
  isRaising?: boolean
  needs?: string[]
}

export interface StartupUpdate {
  id: string
  content: string
  createdAt: string
}

export interface StartupRole {
  id: string
  title: string
  type: 'Job' | 'Internship' | 'Founding Role'
  location: string
  remote: boolean
}

export interface Startup {
  id: string
  name: string
  logoUrl: string
  location: string
  website: string
  tagline: string
  sector: string
  problem: string
  solution: string
  targetCustomer: string
  businessModel: string
  whatBuilding: string
  stage: StartupStage
  traction: string
  revenue: string
  customers: string
  users: string
  growth: string
  otherTraction: string
  keywords: string
  visibility: StartupVisibility
  fundraisingVisible: boolean
  needs: string[]
  /** Embedded (mock era). The real backend exposes these via separate endpoints:
   *  getStartupMembers/getStartupUpdates/getStartupRoles. */
  team?: StartupTeamMember[]
  updates?: StartupUpdate[]
  openRoles?: StartupRole[]
  ideaId?: string
  chapterId?: string
  followerIds?: string[]
  isFollowing?: boolean
  isRaising: boolean
  /** True only for an active founder of this startup — drives edit/delete/manage-material UI. */
  canManage: boolean
  /** Real percentage of optional profile fields actually filled in, computed server-side. */
  profileCompletionPercent: number
  createdAt: string
}
