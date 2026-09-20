import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Rocket, Plus } from 'lucide-react'
import { listStartups } from '@/services/startups.service'
import { StartupCard } from '@/components/domain/StartupCard'
import type { Startup, StartupStage } from '@/types'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Modal } from '@/components/ui/Modal'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

const STAGE_FILTERS = [
  { key: 'all', label: 'All stages' },
  { key: 'Idea', label: 'Idea' },
  { key: 'MVP', label: 'MVP' },
  { key: 'Early Traction', label: 'Early Traction' },
  { key: 'Growth', label: 'Growth' },
  { key: 'Scaling', label: 'Scaling' },
]

export default function StartupsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [stage, setStage] = useState('all')
  const [raisingOnly, setRaisingOnly] = useState(false)
  const [isCheckingExistingStartup, setIsCheckingExistingStartup] = useState(false)
  const [existingStartupOpen, setExistingStartupOpen] = useState(false)
  const [myStartups, setMyStartups] = useState<Startup[]>([])

  const filters = useMemo(
    () => ({
      query: query || undefined,
      stage: stage === 'all' ? undefined : (stage as StartupStage),
      isRaising: raisingOnly ? true : undefined,
    }),
    [query, stage, raisingOnly],
  )

  const { data: startups, isLoading } = useQuery({ queryKey: ['startups', filters], queryFn: () => listStartups(filters) })

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

  return (
    <div>
      <PageHeader
        title="Startups"
        description="See what’s being built across the BuildAdda network."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Rocket className="size-4" />}
              isLoading={isCheckingExistingStartup}
              onClick={handleExistingStartupClick}
            >
              My startup
            </Button>
            <Link to="/startups/new" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden="true" />
              Create a startup
            </Link>
          </div>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Filter startups by name or sector…">
        <div className="flex flex-wrap items-center gap-3">
          <PillTabs label="Stage" items={STAGE_FILTERS} value={stage} onChange={setStage} />
          <button
            type="button"
            aria-pressed={raisingOnly}
            onClick={() => setRaisingOnly((v) => !v)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150',
              raisingOnly
                ? 'bg-brand-500/10 text-fg-brand border-brand-500/30'
                : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
            )}
          >
            Raising now
          </button>
        </div>
      </SearchFilterBar>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : startups && startups.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Rocket className="size-5" />} title="No startups match yet" description="Try a different search or clear your filters." />
      )}

      <Modal
        open={existingStartupOpen}
        onClose={() => setExistingStartupOpen(false)}
        title="Your startups"
        description="Pick a startup to view or manage."
        size="md"
      >
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
                  Create a startup
                </Link>
                <Link
                  to="/ideas/new"
                  onClick={() => setExistingStartupOpen(false)}
                  className="text-xs text-fg-muted hover:text-fg hover:underline"
                >
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
