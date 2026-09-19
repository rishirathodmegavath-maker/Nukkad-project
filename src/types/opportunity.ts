import type { Experience, User, UserProject } from './user'

export type OpportunityType =
  | 'Full-time'
  | 'Internship'
  | 'Founding Role'
  | 'Co-founder'
  | 'Startup Project'
  | 'AI/ML Role'
  | 'Campus'

export type ApplicationStatus = 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Withdrawn'

export type WorkMode = 'Remote' | 'Hybrid' | 'In-person'

export interface Opportunity {
  id: string
  title: string
  type: OpportunityType
  closed: boolean
  startupId?: string
  organizationName: string
  location: string
  workMode: WorkMode
  description: string
  responsibilities?: string
  requirements: string[]
  requiredSkills: string[]
  compensation?: string
  equity?: string
  experienceLevel?: string
  /** ISO datetime. Applications aren't blocked automatically once this passes — closing the
   *  opportunity is still the explicit action that does that — it's informational for candidates. */
  applicationDeadline?: string
  postedByUserId: string
  /** Embedded (mock era). The real backend exposes viewer-relative state/counts instead. */
  applicantIds?: string[]
  interestedIds?: string[]
  hasApplied?: boolean
  hasExpressedInterest?: boolean
  /** The viewer's own application status for this opportunity, if they've applied. */
  applicationStatus?: ApplicationStatus
  /** ISO datetime the viewer applied, if they've applied — distinct from the opportunity's own createdAt. */
  appliedAt?: string
  applicantCount?: number
  interestCount?: number
  chapterId?: string
  /** Pre-publish review gate — a brand-new posting starts PENDING and is invisible to public
   *  discovery until an admin approves it; only the poster and a platform admin can see it before then. */
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: string
}

export interface PostOpportunityInput {
  title: string
  type: OpportunityType
  startupId?: string
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
}

export interface ApplyToOpportunityInput {
  whyInterested: string
  whyGoodFit: string
  relevantSkills?: string[]
  experienceIds?: string[]
  projectIds?: string[]
  availability?: string
  expectedCommitment?: string
  additionalMessage?: string
}

export interface Application {
  id: string
  opportunityId: string
  opportunityTitle: string
  applicant: User
  status: ApplicationStatus
  whyInterested: string
  whyGoodFit: string
  relevantSkills: string[]
  relevantExperience: Experience[]
  relevantProjects: UserProject[]
  availability?: string
  expectedCommitment?: string
  additionalMessage?: string
  createdAt: string
  reviewedAt?: string
}
