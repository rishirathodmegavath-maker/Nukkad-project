import type { Experience, User, UserProject } from './user'

export type IdeaStage = 'Concept' | 'Validating' | 'Building' | 'Launched'

export type ContributionArea =
  | 'AI/ML'
  | 'Technology'
  | 'Product'
  | 'Design'
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Domain Expertise'

export type IdeaInterestStatus = 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Withdrawn'

export interface IdeaInterest {
  id: string
  ideaId: string
  ideaTitle: string
  applicant: User
  status: IdeaInterestStatus
  contributionAreas: ContributionArea[]
  message?: string
  relevantSkills: string[]
  relevantExperience: Experience[]
  relevantProjects: UserProject[]
  createdAt: string
  reviewedAt?: string
}

export interface ExpressInterestInput {
  contributionAreas: ContributionArea[]
  message?: string
  relevantSkills?: string[]
  experienceIds?: string[]
  projectIds?: string[]
}

export interface Idea {
  id: string
  title: string
  problem: string
  solution: string
  targetCustomer: string
  stage: IdeaStage
  helpNeeded: ContributionArea[]
  category: string
  tags: string[]
  creatorId: string
  chapterId?: string
  /** Embedded per-interest detail (mock era). The real backend exposes this via
   *  a separate `getIdeaMembers()` call instead — see `interestCount` for a cheap
   *  list-view count that doesn't need a second request. */
  interests?: IdeaInterest[]
  interestCount?: number
  teamUserIds: string[]
  startupId?: string
  /** Pre-publish review gate — a brand-new idea starts PENDING and is invisible to public
   *  discovery until an admin approves it; only the creator and an admin can see it before then. */
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: string
}
