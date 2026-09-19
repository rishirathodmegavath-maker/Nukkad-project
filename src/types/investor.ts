import type { User } from './user'

export type InvestorType = 'Angel' | 'VC' | 'Family Office' | 'Corporate VC' | 'Accelerator' | 'Other'

export interface InvestorProfile {
  id: string
  userId: string
  user?: User
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
  /** Server-computed: whether the viewer is this profile's owner. */
  canManage: boolean
  createdAt: string
}

export type FundraiseStatus = 'Open' | 'Closed'

export interface Fundraise {
  id: string
  startupId: string
  startupName?: string
  targetAmount: number
  amountRaised: number
  fundingStage: string
  useOfFunds?: string
  minimumTicket?: number
  status: FundraiseStatus
  /** Server-computed: whether the viewer is a founder of the underlying startup. */
  canManage: boolean
  createdAt: string
}

export type IntroDirection = 'FOUNDER_TO_INVESTOR' | 'INVESTOR_TO_FOUNDER'
export type IntroRequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'

export interface IntroRequest {
  id: string
  requesterId: string
  requester?: User
  recipientId: string
  recipient?: User
  direction: IntroDirection
  startupId?: string
  startupName?: string
  ideaId?: string
  ideaTitle?: string
  message: string
  status: IntroRequestStatus
  createdAt: string
  reviewedAt?: string
  /** Set once the request is Accepted — the conversation opened between requester and recipient. */
  conversationId?: string
}
