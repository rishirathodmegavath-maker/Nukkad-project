export type ProgramFieldType = 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'DATE' | 'URL' | 'SELECT' | 'MULTISELECT'

export interface ProgramField {
  key: string
  label: string
  type: ProgramFieldType
  required: boolean
  options: string[]
}

export interface ProgramStep {
  id: string
  title: string
  fields: ProgramField[]
}

export interface ProgramJourneyPhase {
  number: number
  title: string
  description: string
}

/** A program's key is its lowercase slug ("spark" / "ignite") — used in URLs and API calls;
 *  the backend's own {@code Program} enum is uppercase, mapped at the service boundary. */
export type ProgramKey = 'spark' | 'ignite'

export interface Program {
  key: ProgramKey
  name: string
  tagline: string
  description: string
  highlights: string[]
  targetAudience: string[]
  journey: ProgramJourneyPhase[]
  benefits: string[]
  outcome: string
  applicationSteps: ProgramStep[]
  applicationOpen: boolean
  feeAmount: number | null
  feeCurrency: string | null
  enrollmentInfo: string | null
  selective: boolean | null
}

export type ProgramApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'

export interface ProgramApplication {
  id: string
  program: ProgramKey
  status: ProgramApplicationStatus
  answers: Record<string, string>
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminProgramApplication extends ProgramApplication {
  applicantUserId: string
  applicantName: string | null
  applicantEmail: string | null
  adminNote: string | null
  reviewedBy: string | null
  reviewedByName: string | null
  reviewedAt: string | null
}
