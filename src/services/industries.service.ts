import { apiClient } from '@/lib/api-client'

/** An industry derived from real sector data on startups and catalog investors — not a curated
 *  taxonomy. One entry per distinct sector spelling on BuildAdda right now. */
export interface Industry {
  name: string
  slug: string
  startupCount: number
}

export interface IndustryDetail extends Industry {
  investorCount: number
  grantCount: number
  /** Stage label (e.g. "MVP") -> how many matching startups are at that stage. */
  stageDistribution: Record<string, number>
  /** Matching startups created in the last 90 days. */
  recentStartupCount: number
  /** Matching startups created in the 90 days before that — the comparison point for a trend. */
  priorStartupCount: number
  asOf: string
}

export async function listIndustries(params: { q?: string } = {}): Promise<Industry[]> {
  const query = new URLSearchParams()
  if (params.q?.trim()) query.set('q', params.q.trim())
  const suffix = query.toString() ? `?${query}` : ''
  return apiClient.get<Industry[]>(`/industries${suffix}`)
}

export async function getIndustry(slug: string): Promise<IndustryDetail | undefined> {
  try {
    return await apiClient.get<IndustryDetail>(`/industries/${encodeURIComponent(slug)}`)
  } catch {
    return undefined
  }
}
