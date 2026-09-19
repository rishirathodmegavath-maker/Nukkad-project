import { apiClient } from '@/lib/api-client'
import type { FounderDashboard } from '@/types'

interface FounderDashboardDto {
  hasFoundedStartup: boolean
  primaryStartupId: string | null
  primaryStartupName: string | null
  startupCount: number
  profileViews: number
  investorInterests: number
  jobApplications: number
  followers: number
  eventRsvps: number
  profileCompletionPercent: number
}

export async function getFounderDashboard(): Promise<FounderDashboard> {
  const dto = await apiClient.get<FounderDashboardDto>('/dashboard/founder')
  return {
    hasFoundedStartup: dto.hasFoundedStartup,
    primaryStartupId: dto.primaryStartupId ?? undefined,
    primaryStartupName: dto.primaryStartupName ?? undefined,
    startupCount: dto.startupCount,
    profileViews: dto.profileViews,
    investorInterests: dto.investorInterests,
    jobApplications: dto.jobApplications,
    followers: dto.followers,
    eventRsvps: dto.eventRsvps,
    profileCompletionPercent: dto.profileCompletionPercent,
  }
}
