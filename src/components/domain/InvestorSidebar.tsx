import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Compass, Landmark, Sparkles, Users } from 'lucide-react'
import type { Startup } from '@/types'
import { countCatalogInvestors } from '@/services/investor-catalog.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { buttonClasses } from '@/components/ui/button-styles'

function StatTile({
  icon: Icon,
  value,
  label,
  isLoading,
}: {
  icon: typeof Landmark
  value?: number
  label: string
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-surface-sunken/50 p-3">
      <Icon className="size-4 text-fg-brand" />
      {isLoading ? <Skeleton className="h-5 w-10" /> : <p className="text-lg font-bold text-fg tabular-nums">{value ?? 0}</p>}
      <p className="text-xs text-fg-muted">{label}</p>
    </div>
  )
}

/**
 * Investor Discovery's sidebar: a real Startup Profile summary, a shortcut that filters the catalog down to
 * the founder's own sector/stage, and real aggregate counts read live from the catalog (each a real
 * totalElements query — never a hardcoded marketing number). Deliberately has no "recent activity" or
 * "trending sectors" widget: nothing in the catalog tracks profile views or per-sector counts today, so
 * this sidebar only ever shows a number it can back with a real query.
 */
export function InvestorSidebar({ myStartup, onFindMyInvestors }: { myStartup?: Startup; onFindMyInvestors: () => void }) {
  const totalQuery = useQuery({ queryKey: ['investor-catalog', 'count', 'all'], queryFn: () => countCatalogInvestors() })
  const vcQuery = useQuery({ queryKey: ['investor-catalog', 'count', 'VC'], queryFn: () => countCatalogInvestors({ type: 'VC' }) })
  const angelQuery = useQuery({ queryKey: ['investor-catalog', 'count', 'Angel'], queryFn: () => countCatalogInvestors({ type: 'Angel' }) })
  const acceleratorQuery = useQuery({
    queryKey: ['investor-catalog', 'count', 'Accelerator'],
    queryFn: () => countCatalogInvestors({ type: 'Accelerator' }),
  })

  return (
    <div className="flex flex-col gap-4">
      {myStartup ? (
        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Your startup profile</p>
            <Link to={`/startups/${myStartup.id}`} className="text-xs font-semibold text-fg-brand hover:underline">
              View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Avatar src={myStartup.logoUrl} name={myStartup.name} size="lg" />
            <div className="min-w-0">
              <p className="font-bold text-fg truncate">{myStartup.name}</p>
              {myStartup.tagline && <p className="text-xs text-fg-muted truncate">{myStartup.tagline}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {myStartup.sector && <Badge tone="brand">{myStartup.sector}</Badge>}
            {myStartup.stage && <Badge tone="neutral">{myStartup.stage}</Badge>}
          </div>
        </Card>
      ) : (
        <Card padding="md" className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-fg">Get personalized matches</p>
          <p className="text-xs text-fg-muted">Create a Startup Profile so investors here can be ranked by real fit, not just filtered.</p>
          <Link to="/startups/new" className={buttonClasses({ size: 'sm', className: 'mt-1 w-full' })}>
            Create Startup Profile
          </Link>
        </Card>
      )}

      {myStartup && (
        <Card padding="md" className="flex flex-col gap-2 bg-brand-500/5 border-brand-500/20">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-fg-brand" />
            <p className="text-sm font-semibold text-fg">Find my investors</p>
          </div>
          <p className="text-xs text-fg-muted">
            Jump straight to investors who fund {myStartup.sector || 'your sector'}
            {myStartup.stage ? ` at ${myStartup.stage} stage` : ''}.
          </p>
          <Button size="sm" onClick={onFindMyInvestors}>
            Find my investors
          </Button>
        </Card>
      )}

      <Card padding="md" className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Investor database</p>
        <div className="grid grid-cols-2 gap-2">
          <StatTile icon={Landmark} value={totalQuery.data} label="Investor profiles" isLoading={totalQuery.isLoading} />
          <StatTile icon={Building2} value={vcQuery.data} label="VC & Funds" isLoading={vcQuery.isLoading} />
          <StatTile icon={Users} value={angelQuery.data} label="Angel investors" isLoading={angelQuery.isLoading} />
          <StatTile icon={Sparkles} value={acceleratorQuery.data} label="Accelerators" isLoading={acceleratorQuery.isLoading} />
        </div>
      </Card>
    </div>
  )
}
