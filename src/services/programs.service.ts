import { apiClient, ApiError } from '@/lib/api-client'
import type { Program, ProgramApplication, ProgramApplicationStatus, ProgramFieldType, ProgramJourneyPhase, ProgramKey, ProgramStep } from '@/types'

export interface ProgramFieldDto {
  key: string
  label: string
  type: ProgramFieldType
  required: boolean
  options: string[]
}

export interface ProgramStepDto {
  id: string
  title: string
  fields: ProgramFieldDto[]
}

export interface ProgramJourneyPhaseDto {
  number: number
  title: string
  description: string
}

export interface ProgramDto {
  key: string
  name: string
  tagline: string
  description: string
  highlights: string[]
  targetAudience: string[]
  journey: ProgramJourneyPhaseDto[]
  benefits: string[]
  outcome: string
  applicationSteps: ProgramStepDto[]
  applicationOpen: boolean
  feeAmount: number | null
  feeCurrency: string | null
  enrollmentInfo: string | null
  selective: boolean | null
}

export function mapProgram(dto: ProgramDto): Program {
  return {
    key: dto.key.toLowerCase() as ProgramKey,
    name: dto.name,
    tagline: dto.tagline,
    description: dto.description,
    highlights: dto.highlights,
    targetAudience: dto.targetAudience,
    journey: dto.journey as ProgramJourneyPhase[],
    benefits: dto.benefits,
    outcome: dto.outcome,
    applicationSteps: dto.applicationSteps as ProgramStep[],
    applicationOpen: dto.applicationOpen,
    feeAmount: dto.feeAmount,
    feeCurrency: dto.feeCurrency,
    enrollmentInfo: dto.enrollmentInfo,
    selective: dto.selective,
  }
}

export interface ProgramApplicationDto {
  id: string
  program: string
  status: ProgramApplicationStatus
  answers: Record<string, string>
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export function mapProgramApplication(dto: ProgramApplicationDto): ProgramApplication {
  return {
    id: dto.id,
    program: dto.program.toLowerCase() as ProgramKey,
    status: dto.status,
    answers: dto.answers ?? {},
    submittedAt: dto.submittedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export async function listPrograms(): Promise<Program[]> {
  const dtos = await apiClient.get<ProgramDto[]>('/programs')
  return dtos.map(mapProgram)
}

export async function getProgram(key: ProgramKey): Promise<Program> {
  return mapProgram(await apiClient.get<ProgramDto>(`/programs/${key}`))
}

export async function listMyProgramApplications(): Promise<ProgramApplication[]> {
  const dtos = await apiClient.get<ProgramApplicationDto[]>('/program-applications/mine')
  return dtos.map(mapProgramApplication)
}

/** Null (not thrown) when the caller hasn't started an application for this program — the
 *  landing/wizard pages use this to distinguish "start fresh" from "resume". */
export async function getMyProgramApplication(key: ProgramKey): Promise<ProgramApplication | null> {
  try {
    return mapProgramApplication(await apiClient.get<ProgramApplicationDto>(`/program-applications/mine/${key}`))
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function saveProgramApplicationDraft(key: ProgramKey, answers: Record<string, string>): Promise<ProgramApplication> {
  return mapProgramApplication(await apiClient.put<ProgramApplicationDto>(`/program-applications/${key}/draft`, { answers }))
}

export async function submitProgramApplication(key: ProgramKey): Promise<ProgramApplication> {
  return mapProgramApplication(await apiClient.post<ProgramApplicationDto>(`/program-applications/${key}/submit`))
}

export async function withdrawProgramApplication(id: string): Promise<ProgramApplication> {
  return mapProgramApplication(await apiClient.post<ProgramApplicationDto>(`/program-applications/${id}/withdraw`))
}
