import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Rocket, Plus, TrendingUp } from 'lucide-react'
import { listStartupSectors, listStartups, listStartupsPage } from '@/services/startups.service'
import { StartupCard } from '@/components/domain/StartupCard'
import type { Startup, StartupStage } from '@/types'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { STARTUP_STAGES } from '@/lib/startup-meta'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

const STAGE_FILTERS = [{ key: 'all', label: 'All Stages' }, ...STARTUP_STAGES.map((s) => ({ key: s, label: s }))]

/**
 * Startup discovery. Search, stage, sector and "raising now" are all applied by the server, and they live in the URL so a
 * filtered view can be shared or reloaded. The sector chips are the sectors that visible startups really have.
 */
export default function StartupsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const stageParam = searchParams.get('stage') ?? ''
  const stage = (STARTUP_STAGES as string[]).includes(stageParam) ? (stageParam as StartupStage) : undefined
  const sector = searchParams.get('sector') ?? ''
  const raisingOnly = searchParams.get('raising') === '1'
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0)

  // The search box keeps its own text and only reaches the URL (and so the server) once the person pauses typing.
  const [searchText, setSearchText] = useState(query)
  const searchTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  // The URL is the filter state. Router updates are not queued, so two changes in quick succession would each start from
  // the same old URL and the second would undo the first; keeping the latest params in a ref makes every change build on the last.
  const latestParams = useRef(searchParams)
  useEffect(() => {
    latestParams.current = searchParams
  }, [searchParams])

  function setFilter(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(latestParams.current)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page')
    latestParams.current = next
    setSearchParams(next, { replace: true })
  }

  function handleSearchChange(value: string) {
    setSearchText(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setFilter({ q: value.trim() || undefined }), 300)
  }

  function clearFilters() {
    window.clearTimeout(searchTimer.current)
    setSearchText('')
    latestParams.current = new URLSearchParams()
    setSearchParams({}, { replace: true })
  }

  const filtering = !!(query || stage || sector || raisingOnly)

  const startups = useQuery({
    queryKey: ['startups', 'discover', { query, stage, sector, raisingOnly, page }],
    queryFn: () =>
      listStartupsPage({ query: query || undefined, stage, sector: sector || undefined, isRaising: raisingOnly ? true : undefined, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })
  const sectors = useQuery({ queryKey: ['startups', 'sectors'], queryFn: listStartupSectors, staleTime: 60_000 })

  const sectorItems = [
    { key: '', label: 'All sectors' },
    ...(sectors.data ?? []).map((s) => ({ key: s.sector, label: s.sector, count: s.count })),
  ]
  // A shared link can carry a sector nobody has any more; keep it visible as the active chip so it can be cleared.
  if (sector && !sectorItems.some((item) => item.key.toLowerCase() === sector.toLowerCase())) {
    sectorItems.push({ key: sector, label: sector })
  }
  const activeSector = sectorItems.find((item) => item.key.toLowerCase() === sector.toLowerCase())?.key ?? ''

  const [isCheckingExistingStartup, setIsCheckingExistingStartup] = useState(false)
  const [existingStartupOpen, setExistingStartupOpen] = useState(false)
  const [myStartups, setMyStartups] = useState<Startup[]>([])

  async function handleExistingStartupClick() {
    if (!currentUser) return
    setIsCheckingExistingStartup(true)
    try {
      const mine = await queryClient.fetchQuery({
        queryKey: ['startups', 'member', currentUser.id],
        queryFn: () => listStartups({ memberId: currentUser.id }),
      })
      if (mine.length === 1) {
        navigate(`/startups/${mine[0].id}`)
      } else {
        setMyStartups(mine)
        setExistingStartupOpen(true)
      }
    } catch {
      toast.error('Could not load your startups. Please try again.')
    } finally {
      setIsCheckingExistingStartup(false)
    }
  }

  const result = startups.data
  const total = result?.totalElements ?? 0

  return (
    <div>
      <PageHeader
        title="Startups"
        description="Discover and follow the startups being built on BuildAdda."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" leftIcon={<Rocket className="size-4" />} isLoading={isCheckingExistingStartup} onClick={handleExistingStartupClick}>
              My startup
            </Button>
            <Link to="/startups/new" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden="true" />
              Create Startup
            </Link>
          </div>
        }
      />

      <SearchFilterBar query={searchText} onQueryChange={handleSearchChange} placeholder="Search by name, sector or problem…">
        <div className="flex flex-wrap items-center gap-2">
          <PillTabs label="Stage" items={STAGE_FILTERS} value={stage ?? 'all'} onChange={(key) => setFilter({ stage: key === 'all' ? undefined : key })} />
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <button
            type="button"
            aria-pressed={raisingOnly}
            onClick={() => setFilter({ raising: raisingOnly ? undefined : '1' })}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 sm:text-sm',
              raisingOnly
                ? 'border-brand-500/30 bg-brand-500/10 text-fg-brand'
                : 'border-border/80 bg-surface text-fg-secondary hover:border-border-strong hover:bg-surface-hover hover:text-fg',
            )}
          >
            <TrendingUp className="size-3.5" aria-hidden="true" />
            Raising Now
          </button>
        </div>
        {sectorItems.length > 1 && (
          <PillTabs scrollable label="Sector" items={sectorItems} value={activeSector} onChange={(key) => setFilter({ sector: key || undefined })} />
        )}
      </SearchFilterBar>

      {startups.isError ? (
        <ErrorState title="Couldn’t load startups" onRetry={() => startups.refetch()} />
      ) : startups.isLoading || !result ? (
        <CardSkeletonGrid count={6} />
      ) : result.content.length > 0 ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-fg-muted" aria-live="polite">
              {total} {total === 1 ? 'startup' : 'startups'}
              {filtering ? ' match' : ''}
            </p>
            {filtering && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
          <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', startups.isPlaceholderData && 'opacity-60 transition-opacity')}>
            {result.content.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} onPageChange={(p) => setFilter({ page: p > 0 ? String(p) : undefined })} />
        </>
      ) : filtering ? (
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="No startups match"
          description="Try a different search, or clear the filters to see everything."
          action={
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="No startups yet"
          description="Be the first to put your startup on BuildAdda."
          action={
            <Link to="/startups/new" className={buttonClasses({ size: 'sm' })}>
              Create Startup
            </Link>
          }
        />
      )}

      <Modal open={existingStartupOpen} onClose={() => setExistingStartupOpen(false)} title="Your startups" description="Pick a startup to view or manage." size="md">
        {myStartups.length > 0 ? (
          <div className="flex flex-col gap-3">
            {myStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Rocket className="size-5" />}
            title="No startup yet"
            description="Already building or running something — here or out in the world (think Swiggy, Zomato)? Add it to BuildAdda."
            action={
              <div className="flex flex-col items-center gap-2">
                <Link to="/startups/new" onClick={() => setExistingStartupOpen(false)} className={buttonClasses({ size: 'sm' })}>
                  Create Startup
                </Link>
                <Link to="/ideas/new" onClick={() => setExistingStartupOpen(false)} className="text-xs text-fg-muted hover:text-fg hover:underline">
                  Or turn one of your ideas into a startup
                </Link>
              </div>
            }
          />
        )}
      </Modal>
    </div>
  )
}
