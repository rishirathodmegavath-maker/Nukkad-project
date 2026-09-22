import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { CatalogInvestor } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { investorLogoSrc } from '@/lib/investor-logo'
import { formatCurrency } from '@/lib/utils'

/** A card in Investor Discovery — the admin-managed catalog. `myStartup` (sector/stage) drives the "Matches
 *  your startup" badge: real, factual overlap, never a fabricated match percentage. */
export function CatalogInvestorCard({ investor, myStartup }: { investor: CatalogInvestor; myStartup?: { sector?: string; stage?: string } }) {
  const matchesSector = !!myStartup?.sector && investor.sectors.some((s) => s.toLowerCase() === myStartup.sector!.toLowerCase())
  const matchesStage = !!myStartup?.stage && investor.stages.some((s) => s.toLowerCase() === myStartup.stage!.toLowerCase())

  return (
    <Link to={`/investors/catalog/${investor.id}`}>
      <Card interactive padding="sm" className="flex h-full flex-col gap-3 border border-border/80 shadow-xs hover:border-border-strong hover:shadow-sm transition-all min-w-0 overflow-hidden bg-surface">
        <div className="flex items-start gap-3">
          <Avatar src={investorLogoSrc(investor.logoUrl, investor.domain)} name={investor.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-fg truncate text-base">{investor.name}</p>
            <p className="text-xs sm:text-sm text-fg-muted truncate mt-0.5">{investor.investorType}</p>
            {investor.location && (
              <p className="text-xs text-fg-muted flex items-center gap-1 mt-1 truncate">
                <MapPin className="size-3 shrink-0" /> {investor.location}
              </p>
            )}
          </div>
        </div>

        {investor.description && <p className="text-xs text-fg-secondary leading-relaxed line-clamp-2">{investor.description}</p>}

        <div className="flex flex-wrap gap-1.5">
          {(matchesSector || matchesStage) && <Badge tone="success">Matches your startup</Badge>}
          {investor.stages.slice(0, 2).map((stage) => (
            <Badge key={stage} tone="info">
              {stage}
            </Badge>
          ))}
          {investor.sectors.slice(0, 2).map((sector) => (
            <Badge key={sector} tone="neutral">
              {sector}
            </Badge>
          ))}
        </div>

        {(investor.chequeMin !== undefined || investor.chequeMax !== undefined) && (
          <p className="mt-auto text-xs text-fg-muted font-medium">
            Cheque:{' '}
            <span className="text-fg font-semibold">{investor.chequeMin !== undefined ? formatCurrency(investor.chequeMin) : 'Any'}</span> –{' '}
            <span className="text-fg font-semibold">{investor.chequeMax !== undefined ? formatCurrency(investor.chequeMax) : 'Any'}</span>
          </p>
        )}
      </Card>
    </Link>
  )
}
