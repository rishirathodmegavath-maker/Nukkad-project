import type { CatalogInvestor } from '@/types'

export interface MatchableStartup {
  sector?: string
  stage?: string
  location?: string
}

/**
 * A deterministic 0-100 match score built only from fields the app already has — sector fit (40pts),
 * stage fit (40pts), location fit (10pts) and the investor's own real activity level (up to 10pts from
 * investmentCount). No randomness and no fabricated baseline: two investors with identical real fields
 * always score identically, and an investor with zero overlap with the founder's startup scores 0.
 */
export function computeInvestorMatchScore(investor: CatalogInvestor, startup?: MatchableStartup): number {
  if (!startup) return 0
  let score = 0
  if (startup.sector && investor.sectors.some((s) => s.toLowerCase() === startup.sector!.toLowerCase())) score += 40
  if (startup.stage && investor.stages.some((s) => s.toLowerCase() === startup.stage!.toLowerCase())) score += 40
  if (
    startup.location &&
    ((investor.location && investor.location.toLowerCase().includes(startup.location.toLowerCase())) ||
      (investor.country && investor.country.toLowerCase().includes(startup.location.toLowerCase())))
  ) {
    score += 10
  }
  if (investor.investmentCount !== undefined) score += (Math.min(investor.investmentCount, 20) / 20) * 10
  return Math.round(Math.min(score, 100))
}
