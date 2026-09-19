export type GrantProviderType = 'Government' | 'Accelerator' | 'Corporate' | 'Foundation' | 'Other'

export interface Grant {
  id: string
  name: string
  provider: string
  providerType: GrantProviderType
  description?: string
  fundingAmount?: string
  eligibilityCriteria?: string
  /** Empty means open to every sector. */
  eligibleSectors: string[]
  /** Empty means open to every stage. */
  eligibleStages: string[]
  /** ISO datetime. Absent means rolling / no fixed deadline. */
  deadline?: string
  applicationUrl: string
  createdByUserId: string
  removedByAdmin?: boolean
  removalReason?: string
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  /** Server-computed: whether the viewer added this grant and can edit/delete it. */
  canManage: boolean
  createdAt: string
}

export interface CreateGrantInput {
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
}
