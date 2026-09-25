import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, ChevronRight, TrendingUp, Link2, Users } from 'lucide-react'
import { getCatalogInvestor, hasInvestorDiscoveryAccess } from '@/services/investor-catalog.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { CatalogIntroductionModal } from '@/components/domain/CatalogIntroductionModal'
import { InvestorDiscoveryLocked } from '@/components/domain/InvestorDiscoveryLocked'
import { investorLogoSrc } from '@/lib/investor-logo'
import { formatCurrency } from '@/lib/utils'
import { safeHref } from '@/lib/links'

// lucide-react no longer ships brand/social logos, so every link uses the same generic icon and is told
// apart by its label instead.
const SOCIAL_LINKS: { key: 'facebookUrl' | 'instagramUrl' | 'linkedinUrl' | 'twitterUrl'; label: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'twitterUrl', label: 'Twitter / X' },
  { key: 'facebookUrl', label: 'Facebook' },
  { key: 'instagramUrl', label: 'Instagram' },
]

/** Investor Discovery's investor profile — an admin-managed catalog record. See InvestorProfilePage for the
 *  separate, unrelated self-serve investor-account profile at /investors/:id. Only ever shows fields this
 *  investor actually has — a CSV-imported row with no cheque range or stage preference just omits them. */
export default function InvestorCatalogProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [introOpen, setIntroOpen] = useState(false)

  const accessQuery = useQuery({ queryKey: ['investor-catalog', 'access'], queryFn: hasInvestorDiscoveryAccess })

  const { data: investor, isLoading, isError, refetch } = useQuery({
    queryKey: ['investor-catalog', id],
    queryFn: () => getCatalogInvestor(id!),
    enabled: !!id && accessQuery.data === true,
  })

  if (accessQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }
  if (accessQuery.data !== true) {
    return <InvestorDiscoveryLocked />
  }
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }
  if (isError || !investor) {
    return <ErrorState title="Couldn’t load this investor" onRetry={refetch} />
  }

  const hasActivity = investor.investmentCount !== undefined || investor.exitCount !== undefined
  const hasChequeRange = investor.chequeMin !== undefined || investor.chequeMax !== undefined
  const websiteHref = safeHref(investor.website ?? '')
  const socialLinks = SOCIAL_LINKS.map((s) => ({ ...s, href: safeHref(investor[s.key] ?? '') })).filter((s) => s.href)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/investors" className="hover:text-fg transition-colors">
          Investors
        </Link>
        <ChevronRight className="size-3 text-fg-muted/60" />
        <span className="text-fg truncate max-w-[240px] sm:max-w-md">{investor.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col items-start justify-between gap-5 sm:flex-row">
            <div className="flex items-start gap-5">
              <Avatar src={investorLogoSrc(investor.logoUrl, investor.domain)} name={investor.name} size="xl" />
              <div>
                <h1 className="text-xl font-bold text-fg">{investor.name}</h1>
                {(investor.location || investor.country) && (
                  <p className="text-sm text-fg-muted mt-0.5">{[investor.location, investor.country].filter(Boolean).join(', ')}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge tone="brand">{investor.investorType}</Badge>
                  {investor.sectors.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setIntroOpen(true)}>
              Request introduction
            </Button>
          </Card>

          {investor.description && (
            <Card>
              <h2 className="font-semibold text-fg mb-2">Investment thesis</h2>
              <p className="text-sm text-fg-secondary leading-relaxed">{investor.description}</p>
            </Card>
          )}

          {investor.keyPeople.length > 0 && (
            <Card>
              <h2 className="font-semibold text-fg mb-3 flex items-center gap-1.5">
                <Users className="size-4 text-fg-muted" /> Key people
              </h2>
              <div className="flex flex-wrap gap-2">
                {investor.keyPeople.map((person) => (
                  <span key={person} className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface-sunken/50 px-3 py-1.5">
                    <Avatar name={person} size="xs" />
                    <span className="text-sm font-medium text-fg">{person}</span>
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            {hasActivity && (
              <div>
                <p className="text-xs text-fg-muted flex items-center gap-1"><TrendingUp className="size-3" /> Track record</p>
                <p className="text-sm font-medium text-fg">
                  {investor.investmentCount !== undefined && `${investor.investmentCount} investments`}
                  {investor.investmentCount !== undefined && investor.exitCount !== undefined && ' · '}
                  {investor.exitCount !== undefined && `${investor.exitCount} exits`}
                </p>
              </div>
            )}
            {hasChequeRange && (
              <div>
                <p className="text-xs text-fg-muted">Cheque size</p>
                <p className="text-sm font-medium text-fg">
                  {investor.chequeMin !== undefined ? formatCurrency(investor.chequeMin) : 'Any'} –{' '}
                  {investor.chequeMax !== undefined ? formatCurrency(investor.chequeMax) : 'Any'}
                </p>
              </div>
            )}
            {investor.stages.length > 0 && (
              <div>
                <p className="text-xs text-fg-muted">Stage preference</p>
                <p className="text-sm font-medium text-fg">{investor.stages.join(', ')}</p>
              </div>
            )}
            {investor.programs.length > 0 && (
              <div>
                <p className="text-xs text-fg-muted">Programs</p>
                <p className="text-sm font-medium text-fg">{investor.programs.join(', ')}</p>
              </div>
            )}
            {(investor.location || investor.country) && (
              <div>
                <p className="text-xs text-fg-muted">Location</p>
                <p className="text-sm font-medium text-fg">{[investor.location, investor.country].filter(Boolean).join(', ')}</p>
              </div>
            )}
            {websiteHref && (
              <a href={websiteHref} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
                <Globe className="size-3.5" /> Website
              </a>
            )}
            {socialLinks.map(({ key, label, href }) => (
              <a key={key} href={href!} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
                <Link2 className="size-3.5" /> {label}
              </a>
            ))}
          </Card>

          <p className="text-xs text-fg-muted px-1">
            BuildAdda only facilitates discovery and introductions here — no funds move through the platform.
          </p>
        </div>
      </div>

      {introOpen && <CatalogIntroductionModal investor={investor} onClose={() => setIntroOpen(false)} />}
    </div>
  )
}
