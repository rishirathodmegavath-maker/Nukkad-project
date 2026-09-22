import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Landmark, Sparkles, X } from 'lucide-react'
import { listFundraises, getMyInvestorProfile } from '@/services/investors.service'
import { hasInvestorDiscoveryAccess, listCatalogInvestors } from '@/services/investor-catalog.service'
import { listStartups, listMyFoundedStartups, getStartupMembers, getStartup } from '@/services/startups.service'
import { listIdeas } from '@/services/ideas.service'
import { toast } from '@/store/toast.store'
import { CatalogInvestorRow } from '@/components/domain/CatalogInvestorRow'
import { CatalogIntroductionModal } from '@/components/domain/CatalogIntroductionModal'
import { InvestorDiscoveryLocked } from '@/components/domain/InvestorDiscoveryLocked'
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
import { Pagination } from '@/components/ui/Pagination'
import { buttonClasses } from '@/components/ui/button-styles'
import { formatCurrency } from '@/lib/utils'
import type { CatalogInvestor, Idea, InvestorType, Startup } from '@/types'

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
  const [country, setCountry] = useState('')
  const [chequeSize, setChequeSize] = useState('')
  const [catalogPage, setCatalogPage] = useState(0)
  const [introInvestor, setIntroInvestor] = useState<CatalogInvestor | null>(null)
  const [introTarget, setIntroTarget] = useState<{
    recipientId: string
    recipientName?: string
    direction: 'FOUNDER_TO_INVESTOR' | 'INVESTOR_TO_FOUNDER'
    startupId?: string
    ideaId?: string
    contextLabel?: string
  } | null>(null)

  const hasActiveFilters = !!(investorType || sector || stage || geography || country || chequeSize)
  function clearFilters() {
    setInvestorType('')
    setSector('')
    setStage('')
    setGeography('')
    setCountry('')
    setChequeSize('')
    setCatalogPage(0)
  }

  const catalogFilters = useMemo(
    () => ({
      query: query || undefined,
      type: (investorType as InvestorType) || undefined,
      sector: sector || undefined,
      stage: stage || undefined,
      location: geography || undefined,
      country: country || undefined,
      chequeSize: chequeSize ? Number(chequeSize) : undefined,
    }),
    [query, investorType, sector, stage, geography, country, chequeSize],
  )
  // Investor Discovery requires an active Startup Profile (checked here so the frontend never even
  // fetches investor data for a locked user; the backend enforces it again regardless).
  const accessQuery = useQuery({ queryKey: ['investor-catalog', 'access'], queryFn: hasInvestorDiscoveryAccess, enabled: tab === 'investors' })
  const hasAccess = accessQuery.data === true
  const catalogQuery = useQuery({
    queryKey: ['investor-catalog', catalogFilters, catalogPage],
    // Server-side search/filter/pagination throughout — the catalog can eventually hold 100,000+ rows,
    // so nothing here ever fetches "everyone" into the browser.
    queryFn: () => listCatalogInvestors(catalogFilters, catalogPage, 20),
    enabled: tab === 'investors' && hasAccess,
  })
  // Real data for the "Matches your startup" badge — never a fabricated match score.
  const myStartupsQuery = useQuery({ queryKey: ['startups', 'me', 'founding'], queryFn: listMyFoundedStartups, enabled: tab === 'investors' && hasAccess })
  const myStartup = myStartupsQuery.data?.[0]
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
          myInvestorProfile ? (
            <Link to={`/investors/${myInvestorProfile.id}`} className={buttonClasses({ variant: 'secondary' })}>
              Your investor profile
            </Link>
          ) : (
            <Link to="/investors/activate" className={buttonClasses()}>
              Become an investor
            </Link>
          )
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
        accessQuery.isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : !hasAccess ? (
          <InvestorDiscoveryLocked />
        ) : (
          <>
            <SearchFilterBar query={query} onQueryChange={(v) => { setQuery(v); setCatalogPage(0) }} placeholder="Search investors by name, firm or thesis…">
              <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Select label="Type" value={investorType} onChange={(e) => { setInvestorType(e.target.value); setCatalogPage(0) }}>
                  <option value="">Any type</option>
                  {INVESTOR_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Input label="Sector" value={sector} onChange={(e) => { setSector(e.target.value); setCatalogPage(0) }} placeholder="e.g. AI" />
                <Input label="Stage" value={stage} onChange={(e) => { setStage(e.target.value); setCatalogPage(0) }} placeholder="e.g. Seed" />
                <Input label="Location" value={geography} onChange={(e) => { setGeography(e.target.value); setCatalogPage(0) }} placeholder="e.g. Bangalore" />
                <Input label="Country" value={country} onChange={(e) => { setCountry(e.target.value); setCatalogPage(0) }} placeholder="e.g. India" />
                <Input
                  label="Cheque size (₹)"
                  type="number"
                  min={0}
                  value={chequeSize}
                  onChange={(e) => { setChequeSize(e.target.value); setCatalogPage(0) }}
                  placeholder="e.g. 2000000"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="col-span-full justify-self-start" leftIcon={<X className="size-3.5" />} onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </SearchFilterBar>
            {catalogQuery.isLoading ? (
              <CardSkeletonGrid count={6} />
            ) : catalogQuery.data && catalogQuery.data.content.length > 0 ? (
              <>
                <p className="mb-3 text-sm font-medium text-fg-muted">{catalogQuery.data.totalElements} investors</p>
                <div className="flex flex-col gap-3">
                  {catalogQuery.data.content.map((inv) => (
                    <CatalogInvestorRow
                      key={inv.id}
                      investor={inv}
                      myStartup={myStartup ? { sector: myStartup.sector, stage: myStartup.stage } : undefined}
                      onRequestIntro={() => setIntroInvestor(inv)}
                    />
                  ))}
                </div>
                <Pagination page={catalogQuery.data.page} totalPages={catalogQuery.data.totalPages} totalElements={catalogQuery.data.totalElements} onPageChange={setCatalogPage} />
              </>
            ) : hasActiveFilters || query ? (
              <EmptyState
                icon={<Landmark className="size-5" />}
                title="No investors match your filters"
                description="Try widening the sector, stage, location, country or cheque size — or clear filters to see everyone."
                action={
                  <Button variant="secondary" size="sm" onClick={() => { setQuery(''); clearFilters() }}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Landmark className="size-5" />}
                title="No investors on BuildAdda yet"
                description="Our team is building out the investor database. Check back soon."
              />
            )}
          </>
        )
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
            <h2 className="text-base font-semibold text-fg mb-3">Early-stage startups</h2>
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
              <EmptyState as="h3" title="No early-stage startups yet" />
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-fg mb-3 flex items-center gap-1.5">
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
              <EmptyState as="h3" title="No ideas posted yet" />
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

      {introInvestor && <CatalogIntroductionModal investor={introInvestor} onClose={() => setIntroInvestor(null)} />}
    </div>
  )
}
