import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { InvestorProfile } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export function InvestorCard({ investor, onRequestIntro }: { investor: InvestorProfile; onRequestIntro?: () => void }) {
  const name = investor.user?.name ?? 'Investor'
  return (
    <Card interactive padding="sm" className="flex flex-col gap-3 border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden bg-surface">
      <Link to={`/investors/${investor.id}`} className="flex items-start gap-3">
        <Avatar src={investor.user?.avatarUrl} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-fg truncate text-base">{name}</p>
          <p className="text-xs sm:text-sm text-fg-muted truncate mt-0.5">{investor.firmName || investor.user?.headline}</p>
          {investor.geographies.length > 0 && (
            <p className="text-xs text-fg-muted flex items-center gap-1 mt-1 truncate">
              <MapPin className="size-3 shrink-0" /> {investor.geographies.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </Link>

      {investor.thesis && <p className="text-xs text-fg-secondary leading-relaxed line-clamp-2">{investor.thesis}</p>}

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{investor.investorType}</Badge>
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

      {(investor.ticketMin !== undefined || investor.ticketMax !== undefined) && (
        <p className="text-xs text-fg-muted font-medium">
          Ticket:{' '}
          <span className="text-fg font-semibold">{investor.ticketMin !== undefined ? formatCurrency(investor.ticketMin) : 'Any'}</span> –{' '}
          <span className="text-fg font-semibold">{investor.ticketMax !== undefined ? formatCurrency(investor.ticketMax) : 'Any'}</span>
        </p>
      )}

      {!investor.canManage && onRequestIntro && (
        <Button size="sm" className="mt-auto" onClick={onRequestIntro}>
          Request introduction
        </Button>
      )}
    </Card>
  )
}
