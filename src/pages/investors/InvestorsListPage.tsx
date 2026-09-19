import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Landmark, Sparkles, X } from 'lucide-react'
import { listInvestors, listFundraises, getMyInvestorProfile } from '@/services/investors.service'
import { listStartups, getStartupMembers, getStartup } from '@/services/startups.service'
import { listIdeas } from '@/services/ideas.service'
import { toast } from '@/store/toast.store'
import { InvestorCard } from '@/components/domain/InvestorCard'
import { IntroRequestModal } from '@/components/domain/IntroRequestModal'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { Tabs } from '@/components/ui/Tabs'
import { Input, Select } from '@/components/ui/Input'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { Idea, InvestorType, Startup } from '@/types'

const INVESTOR_TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']

function RaisingStartupCard({ fundraiseId, startupId, targetAmount, amountRaised, stage }: {
  fundraiseId: string
  startupId: string
  targetAmount: number
  amountRaised: number
  stage: string
}) {
  const { data: startup } = useQuery({ queryKey: ['startup', startupId], queryFn: () => getStartup(startupId) })
  if (!startup) return null
  return (
    <Link to={`/investors/fundraises/${fundraiseId}`}>
      <Card interactive className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-fg">{startup.name}</p>
          <Badge tone="accent">{stage}</Badge>
        </div>
        <p className="text-sm text-fg-muted line-clamp-2">{startup.tagline}</p>
        <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
          <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, (amountRaised / targetAmount) * 100)}%` }} />
        </div>
        <p className="text-xs text-fg-muted">
          {formatCurrency(amountRaised)} of {formatCurrency(targetAmount)} raised
        </p>
      </Card>
    </Link>
  )
}

function EarlyStageStartupCard({ startup, canRequestIntro, onRequestIntro }: { startup: Startup; canRequestIntro: boolean; onRequestIntro: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <Link to={`/startups/${startup.id}`}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-fg">{startup.name}</p>
          <Badge tone="neutral">{startup.stage}</Badge>
        </div>
        <p className="text-sm text-fg-muted line-clamp-2 mt-1">{startup.tagline}</p>
      </Link>
      {canRequestIntro && (
        <Button size="sm" variant="secondary" className="mt-auto" onClick={onRequestIntro}>
          Request introduction
        </Button>
      )}
    </Card>
  )
}

function EarlyStageIdeaCard({ idea, canRequestIntro, onRequestIntro }: { idea: Idea; canRequestIntro: boolean; onRequestIntro: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <Link to={`/ideas/${idea.id}`}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-fg">{idea.title}</p>
          <Badge tone="neutral">{idea.stage}</Badge>
        </div>
        <p className="text-sm text-fg-muted line-clamp-2 mt-1">{idea.problem}</p>
      </Link>
      {canRequestIntro && (
        <Button size="sm" variant="secondary" className="mt-auto" onClick={onRequestIntro}>
          Request introduction
        </Button>
      )}
    </Card>
  )
}

export default function InvestorsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as 'investors' | 'raising' | 'early') || 'investors'
  const [query, setQuery] = useState('')
  const [investorType, setInvestorType] = useState('')
  const [sector, setSector] = useState('')
  const [stage, setStage] = useState('')
  const [geography, setGeography] = useState('')
  const [chequeSize, setChequeSize] = useState('')
  const [introTarget, setIntroTarget] = useState<{
    recipientId: string
    recipientName?: string
    direction: 'FOUNDER_TO_INVESTOR' | 'INVESTOR_TO_FOUNDER'
    startupId?: string
    ideaId?: string
    contextLabel?: string
  } | null>(null)

  const hasActiveFilters = !!(investorType || sector || stage || geography || chequeSize)
  function clearFilters() {
    setInvestorType('')
    setSector('')
    setStage('')
    setGeography('')
    setChequeSize('')
  }

  const filters = useMemo(
    () => ({
      query: query || undefined,
      type: (investorType as InvestorType) || undefined,
      sector: sector || undefined,
      stage: stage || undefined,
      geography: geography || undefined,
      ticketSize: chequeSize ? Number(chequeSize) : undefined,
    }),
    [query, investorType, sector, stage, geography, chequeSize],
  )
  const investorsQuery = useQuery({ queryKey: ['investors', filters], queryFn: () => listInvestors(filters), enabled: tab === 'investors' })
  const fundraisesQuery = useQuery({ queryKey: ['fundraises', 'open'], queryFn: () => listFundraises({ status: 'Open' }), enabled: tab === 'raising' })
  const earlyStartupsQuery = useQuery({
    queryKey: ['startups', 'early-stage'],
    queryFn: () => listStartups({ isRaising: false }),
    enabled: tab === 'early',
  })
  const earlyIdeasQuery = useQuery({ queryKey: ['ideas', 'early-stage'], queryFn: () => listIdeas(), enabled: tab === 'early' })
  const { data: myInvestorProfile } = useQuery({ queryKey: ['investors', 'me'], queryFn: getMyInvestorProfile })

  async function requestIntroForStartup(startup: Startup) {
    const members = await getStartupMembers(startup.id)
    const founder = members.find((m) => m.isFounder)
    if (!founder) {
      toast.error("Could not find this startup's founder")
      return
    }
    setIntroTarget({ recipientId: founder.userId, direction: 'INVESTOR_TO_FOUNDER', startupId: startup.id, contextLabel: startup.name })
  }

  return (
    <div>
      <PageHeader
        title="Investor Marketplace"
        description="Discover investors, founders and ideas at every stage. Introductions only — no execution happens here."
        action={
          !myInvestorProfile ? (
            <Link to="/investors/activate">
              <Button>Become an investor</Button>
            </Link>
          ) : undefined
        }
      />
      <Tabs
        value={tab}
        onChange={(k) => setSearchParams(k === 'investors' ? {} : { tab: k })}
        items={[
          { key: 'investors', label: 'Investors' },
          { key: 'raising', label: 'Startups raising' },
          { key: 'early', label: 'Early stage' },
        ]}
        className="mb-6"
      />

      {tab === 'investors' && (
        <>
          {myInvestorProfile && (
            <Link to={`/investors/${myInvestorProfile.id}`}>
              <Card interactive className="flex items-center justify-between gap-3 mb-6 border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20">
                <div>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-0.5">Your investor profile</p>
                  <p className="text-sm font-semibold text-fg">{myInvestorProfile.firmName || 'View your profile'}</p>
                </div>
                <Button size="sm" variant="secondary">
                  View profile
                </Button>
              </Card>
            </Link>
          )}
          <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search investors by name, firm or thesis…">
            <div className="flex flex-wrap items-end gap-3">
              <Select label="Type" value={investorType} onChange={(e) => setInvestorType(e.target.value)} className="w-40">
                <option value="">Any type</option>
                {INVESTOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. AI" className="w-36" />
              <Input label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="e.g. Seed" className="w-36" />
              <Input label="Location" value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g. Bangalore" className="w-40" />
              <Input
                label="Cheque size (₹)"
                type="number"
                min={0}
                value={chequeSize}
                onChange={(e) => setChequeSize(e.target.value)}
                placeholder="e.g. 2000000"
                className="w-40"
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" leftIcon={<X className="size-3.5" />} onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </SearchFilterBar>
          {investorsQuery.isLoading ? (
            <CardSkeletonGrid count={6} />
          ) : investorsQuery.data && investorsQuery.data.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {investorsQuery.data.map((inv) => (
                <InvestorCard
                  key={inv.id}
                  investor={inv}
                  onRequestIntro={() =>
                    setIntroTarget({ recipientId: inv.userId, recipientName: inv.user?.name, direction: 'FOUNDER_TO_INVESTOR' })
                  }
                />
              ))}
            </div>
          ) : hasActiveFilters || query ? (
            <EmptyState
              icon={<Landmark className="size-5" />}
              title="No investors match your filters"
              description="Try widening the sector, stage, location or cheque size — or clear filters to see everyone."
              action={
                <Button variant="secondary" size="sm" onClick={() => { setQuery(''); clearFilters() }}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Landmark className="size-5" />}
              title="No investors on Buildadda yet"
              description="Once investors activate a profile, they'll show up here for founders to discover."
            />
          )}
        </>
      )}

      {tab === 'raising' &&
        (fundraisesQuery.isLoading ? (
          <CardSkeletonGrid count={4} />
        ) : fundraisesQuery.data && fundraisesQuery.data.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {fundraisesQuery.data.map((f) => (
              <RaisingStartupCard key={f.id} fundraiseId={f.id} startupId={f.startupId} targetAmount={f.targetAmount} amountRaised={f.amountRaised} stage={f.fundingStage} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open fundraises right now"
            description="Startups currently raising funding rounds will be highlighted here."
          />
        ))}

      {tab === 'early' && (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-sm font-semibold text-fg-secondary uppercase tracking-wide mb-3">Early-stage startups</h2>
            {earlyStartupsQuery.isLoading ? (
              <CardSkeletonGrid count={3} />
            ) : earlyStartupsQuery.data && earlyStartupsQuery.data.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {earlyStartupsQuery.data.map((s) => (
                  <EarlyStageStartupCard
                    key={s.id}
                    startup={s}
                    canRequestIntro={!!myInvestorProfile}
                    onRequestIntro={() => requestIntroForStartup(s)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No early-stage startups yet" />
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-fg-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Ideas & builders
            </h2>
            {earlyIdeasQuery.isLoading ? (
              <CardSkeletonGrid count={3} />
            ) : earlyIdeasQuery.data && earlyIdeasQuery.data.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {earlyIdeasQuery.data.map((i) => (
                  <EarlyStageIdeaCard
                    key={i.id}
                    idea={i}
                    canRequestIntro={!!myInvestorProfile}
                    onRequestIntro={() => setIntroTarget({ recipientId: i.creatorId, direction: 'INVESTOR_TO_FOUNDER', ideaId: i.id, contextLabel: i.title })}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No ideas posted yet" />
            )}
          </div>

          {!myInvestorProfile && (
            <p className="text-sm text-fg-muted">
              <Link to="/investors/activate" className="text-fg font-semibold hover:underline">
                Activate an investor profile
              </Link>{' '}
              to reach out to founders directly.
            </p>
          )}
        </div>
      )}

      {introTarget && (
        <IntroRequestModal
          open
          onClose={() => setIntroTarget(null)}
          recipientId={introTarget.recipientId}
          recipientName={introTarget.recipientName}
          direction={introTarget.direction}
          startupId={introTarget.startupId}
          ideaId={introTarget.ideaId}
          contextLabel={introTarget.contextLabel}
        />
      )}
    </div>
  )
}
