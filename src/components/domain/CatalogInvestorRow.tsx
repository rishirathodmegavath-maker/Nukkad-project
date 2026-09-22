import { Link } from 'react-router-dom'
import { MapPin, TrendingUp } from 'lucide-react'
import type { CatalogInvestor } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { investorLogoSrc } from '@/lib/investor-logo'
import { formatCurrency } from '@/lib/utils'

const VISIBLE_SECTORS = 3

/**
 * One row in Investor Discovery's directory — a compact, information-dense list row (the OpenVC-style
 * pattern the product asked for), not an oversized card. Only ever shows fields the investor actually has;
 * a CSV-imported row with no cheque data or stage preference just omits those bits rather than showing a
 * fabricated placeholder.
 */
export function CatalogInvestorRow({
  investor,
  myStartup,
  onRequestIntro,
}: {
  investor: CatalogInvestor
  myStartup?: { sector?: string; stage?: string }
  onRequestIntro: () => void
}) {
  const matchesSector = !!myStartup?.sector && investor.sectors.some((s) => s.toLowerCase() === myStartup.sector!.toLowerCase())
  const matchesStage = !!myStartup?.stage && investor.stages.some((s) => s.toLowerCase() === myStartup.stage!.toLowerCase())
  const hasChequeRange = investor.chequeMin !== undefined || investor.chequeMax !== undefined
  const hasActivity = investor.investmentCount !== undefined || investor.exitCount !== undefined
  const extraSectors = investor.sectors.length - VISIBLE_SECTORS
  const profileHref = `/investors/catalog/${investor.id}`

  return (
    <Card
      padding="sm"
      className="flex flex-col gap-4 border border-border/80 shadow-2xs transition-all hover:border-border-strong hover:shadow-sm sm:flex-row sm:items-center"
    >
      <Link to={profileHref} className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
        <Avatar src={investorLogoSrc(investor.logoUrl, investor.domain)} name={investor.name} size="lg" className="mt-0.5 sm:mt-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-bold text-fg truncate text-[15px]">{investor.name}</p>
            <Badge tone="brand">{investor.investorType}</Badge>
            {(matchesSector || matchesStage) && <Badge tone="success">Matches your startup</Badge>}
          </div>

          {investor.description && <p className="mt-1 text-xs text-fg-secondary leading-relaxed line-clamp-1">{investor.description}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            {(investor.location || investor.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                {[investor.location, investor.country].filter(Boolean).join(', ')}
              </span>
            )}
            {hasActivity && (
              <span className="flex items-center gap-1 font-medium text-fg-secondary">
                <TrendingUp className="size-3 shrink-0" />
                {investor.investmentCount !== undefined && `${investor.investmentCount} investments`}
                {investor.investmentCount !== undefined && investor.exitCount !== undefined && ' · '}
                {investor.exitCount !== undefined && `${investor.exitCount} exits`}
              </span>
            )}
            {hasChequeRange && (
              <span className="font-medium text-fg-secondary">
                {investor.chequeMin !== undefined ? formatCurrency(investor.chequeMin) : 'Any'}
                {' – '}
                {investor.chequeMax !== undefined ? formatCurrency(investor.chequeMax) : 'Any'}
              </span>
            )}
          </div>

          {(investor.sectors.length > 0 || investor.programs.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {investor.sectors.slice(0, VISIBLE_SECTORS).map((sector) => (
                <Badge key={sector} tone="neutral">
                  {sector}
                </Badge>
              ))}
              {extraSectors > 0 && <Badge tone="neutral">+{extraSectors}</Badge>}
              {investor.programs.slice(0, 1).map((program) => (
                <Badge key={program} tone="info">
                  {program}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Always a vertical stack (flex-col's default stretch makes both children full-width on their own) —
          a row-of-two-buttons on a narrow phone risks exactly the horizontal overflow the layout must avoid. */}
      <div className="flex shrink-0 flex-col gap-2 sm:w-40">
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
