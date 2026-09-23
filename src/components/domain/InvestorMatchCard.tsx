import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { CatalogInvestor } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { investorLogoSrc } from '@/lib/investor-logo'
import { formatCurrency } from '@/lib/utils'

const VISIBLE_SECTORS = 3

function matchTone(score: number): BadgeTone {
  if (score >= 80) return 'success'
  if (score >= 50) return 'primary'
  return 'warning'
}

/**
 * A featured "Recommended for you" card for Investor Discovery's top matches. Same real investor fields as
 * CatalogInvestorRow, just laid out as a hero card with its real match score (see computeInvestorMatchScore)
 * instead of the row's plain "Matches your startup" badge — the score is always computed from the signed-in
 * founder's own startup, never a fabricated number.
 */
export function InvestorMatchCard({
  investor,
  matchScore,
  onRequestIntro,
}: {
  investor: CatalogInvestor
  matchScore: number
  onRequestIntro: () => void
}) {
  const extraSectors = investor.sectors.length - VISIBLE_SECTORS
  const hasChequeRange = investor.chequeMin !== undefined || investor.chequeMax !== undefined
  const profileHref = `/investors/catalog/${investor.id}`

  return (
    <Card
      padding="sm"
      className="flex flex-col gap-3 border border-border/80 shadow-2xs transition-all hover:border-border-strong hover:shadow-md hover:-translate-y-0.5"
    >
      <Badge tone={matchTone(matchScore)} size="md" className="self-start">
        {matchScore}% match
      </Badge>

      <Link to={profileHref} className="flex flex-col gap-3">
        <Avatar src={investorLogoSrc(investor.logoUrl, investor.domain)} name={investor.name} size="lg" />

        <div className="min-w-0">
          <p className="font-bold text-fg text-[15px] truncate">{investor.name}</p>
          <p className="text-xs text-fg-muted">{investor.investorType}</p>
        </div>

        {investor.description && <p className="text-xs text-fg-secondary leading-relaxed line-clamp-2">{investor.description}</p>}

        {investor.sectors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {investor.sectors.slice(0, VISIBLE_SECTORS).map((sector) => (
              <Badge key={sector} tone="neutral">
                {sector}
              </Badge>
            ))}
            {extraSectors > 0 && <Badge tone="neutral">+{extraSectors}</Badge>}
          </div>
        )}

        <div className="flex flex-col gap-1 text-xs text-fg-muted">
          {investor.stages.length > 0 && <span>{investor.stages.join(', ')}</span>}
          {hasChequeRange && (
            <span className="font-medium text-fg-secondary">
              {investor.chequeMin !== undefined ? formatCurrency(investor.chequeMin) : 'Any'}
              {' – '}
              {investor.chequeMax !== undefined ? formatCurrency(investor.chequeMax) : 'Any'}
            </span>
          )}
          {(investor.location || investor.country) && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              {[investor.location, investor.country].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-auto flex flex-col gap-2 pt-1">
        <Button size="sm" onClick={onRequestIntro}>
          Request introduction
        </Button>
        <Link
          to={profileHref}
          className="rounded-lg px-3 py-1.5 text-center text-xs font-semibold text-fg-secondary hover:bg-surface-hover hover:text-fg transition-colors"
        >
          View profile
        </Link>
      </div>
    </Card>
  )
}
