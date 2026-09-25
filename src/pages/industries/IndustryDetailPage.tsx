import type { ReactNode } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, TrendingUp, Landmark, HandCoins, Rocket, Info } from 'lucide-react'
import { getIndustry } from '@/services/industries.service'
import { listStartupsPage } from '@/services/startups.service'
import { StartupCard } from '@/components/domain/StartupCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton, CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'

const STAGE_ORDER = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

export default function IndustryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0)

  const { data: industry, isLoading, isError, refetch } = useQuery({
    queryKey: ['industry', slug],
    queryFn: async () => (await getIndustry(slug!)) ?? null,
    enabled: !!slug,
  })

  const startups = useQuery({
    queryKey: ['industry', slug, 'startups', page],
    queryFn: () => listStartupsPage({ sector: industry!.name, page, size: 9 }),
    enabled: !!industry,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <Skeleton className="h-32 w-full rounded-xl" />
        <CardSkeletonGrid count={3} />
      </div>
    )
  }

  if (isError) {
    return <ErrorState title="Couldn't load this industry" onRetry={refetch} />
  }

  if (!industry) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-5" />}
        title="Industry not found"
        description="This industry may have been renamed as real sector data changed, or never existed."
        action={
          <Link to="/industries" className="text-sm font-semibold text-fg-brand hover:opacity-80 underline underline-offset-4">
            Back to Industries
          </Link>
        }
      />
    )
  }

  const momentum = industry.recentStartupCount - industry.priorStartupCount
  const stageEntries = Object.entries(industry.stageDistribution).sort(
    (a, b) => STAGE_ORDER.indexOf(a[0]) - STAGE_ORDER.indexOf(b[0]),
  )
  const startupResult = startups.data

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/industries" className="hover:text-fg transition-colors">
          Industries
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{industry.name}</span>
      </div>

      <Card className="border border-border/80 bg-surface shadow-xs p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface-sunken text-fg-brand border border-border/80 shrink-0">
            <TrendingUp className="size-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-fg tracking-tight leading-snug">{industry.name}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile icon={<Rocket className="size-4" />} label="Startups" value={industry.startupCount} />
          <StatTile icon={<Landmark className="size-4" />} label="Interested investors" value={industry.investorCount} />
          <StatTile icon={<HandCoins className="size-4" />} label="Open grants" value={industry.grantCount} />
        </div>

        {stageEntries.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Startups by stage</p>
            <div className="flex flex-wrap gap-1.5">
              {stageEntries.map(([stage, count]) => (
                <Badge key={stage} tone="neutral">
                  {stage}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-border/60">
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Recent momentum</p>
          {industry.recentStartupCount + industry.priorStartupCount > 0 ? (
            <p className="text-sm text-fg-secondary">
              <span className="font-semibold text-fg">{industry.recentStartupCount}</span> new{' '}
              {industry.recentStartupCount === 1 ? 'startup' : 'startups'} in the last 90 days, vs.{' '}
              <span className="font-semibold text-fg">{industry.priorStartupCount}</span> in the 90 days before that
              {momentum !== 0 && (
                <Badge tone={momentum > 0 ? 'success' : 'neutral'} className="ml-2">
                  {momentum > 0 ? '+' : ''}
                  {momentum}
                </Badge>
              )}
              .
            </p>
          ) : (
            <p className="text-sm text-fg-muted">Not enough recent activity to show a trend yet.</p>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-border/60 flex items-start gap-2 text-xs text-fg-muted">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <p>
            Every number above is computed live from BuildAdda's own data as of{' '}
            {new Date(industry.asOf).toLocaleString()} — no market size, growth rate or external source is shown
            because this data model doesn't track one for real. BuildAdda is the source.
          </p>
        </div>
      </Card>

      <div>
        <h2 className="text-base font-bold text-fg tracking-tight mb-3">Startups in {industry.name}</h2>
        {startups.isError ? (
          <ErrorState title="Couldn't load startups" onRetry={() => startups.refetch()} />
        ) : startups.isLoading || !startupResult ? (
          <CardSkeletonGrid count={3} />
        ) : startupResult.content.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {startupResult.content.map((s) => (
              <StartupCard key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Rocket className="size-5" />} title="No visible startups in this industry yet" as="h3" />
        )}
        {startupResult && (
          <Pagination
            page={startupResult.page}
            totalPages={startupResult.totalPages}
            totalElements={startupResult.totalElements}
            onPageChange={(p) => setSearchParams(p > 0 ? { page: String(p) } : {}, { replace: true })}
          />
        )}
      </div>
    </div>
  )
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-surface-sunken/40 p-3.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        {icon}
        {label}
      </span>
      <span className="text-xl font-black text-fg tracking-tight">{value}</span>
    </div>
  )
}
