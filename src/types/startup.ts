import type { User } from './user'

export type StartupStage = 'Idea' | 'MVP' | 'Early Traction' | 'Growth' | 'Scaling'

/** INVITED: a founder or admin asked this person to join and they have not answered yet (they are not on the team until they accept). */
export type StartupMembershipStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INVITED'

export type StartupTeamRole = 'FOUNDER' | 'ADMIN' | 'MEMBER'

/** The wire value is unchanged for API compatibility ('Nukkad Members' is what the backend's enum label
 *  and its DB column still store) — only the text shown to a person should ever say BuildAdda. */
export type StartupVisibility = 'Public' | 'Nukkad Members'

export function startupVisibilityLabel(visibility: StartupVisibility): string {
  return visibility === 'Nukkad Members' ? 'BuildAdda Members' : visibility
}

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
  teamRole: StartupTeamRole
  isFounder: boolean
  isAdmin: boolean
  /** Founder or Admin — unlocks edit-startup/manage-team/post-jobs/edit-fundraising. */
  canManage: boolean
  status: StartupMembershipStatus
  roleId?: string
  reviewedAt?: string
  /** Who this is, sent along with the team list so showing the team needs no request per person. */
  user?: User
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
  /** How many members follow this startup: the real count from the server. */
  followerCount: number
  isRaising: boolean
  /** True for an active founder OR admin of this startup — drives edit/manage-material UI.
   *  Delete-startup stays founder-only; check the viewer's own membership for that. */
  canManage: boolean
  /** Real percentage of optional profile fields actually filled in, computed server-side. */
  profileCompletionPercent: number
  /** New startups go live as APPROVED with no review. REJECTED only appears on startups an admin rejected
   *  before that changed; those stay hidden from everyone but their founders/admins and platform admins. */
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: string
}
