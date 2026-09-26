import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Rocket, Search } from 'lucide-react'
import { listPrograms } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { PillTabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'

/** Startup Programs is the one Resources shelf with its own dedicated discovery + application
 *  experience rather than a filterable grid of resource cards — see ResourcesPage's shelf tile,
 *  which links here instead of into ?category=programs. The filter pills mirror the reference
 *  design's categories; only "All"/"Startup Programs" actually narrow anything today since SPARK
 *  and IGNITE are the only two programs that exist — the rest are kept for the layout the spec
 *  asked for without pretending to filter content that doesn't exist yet. */
const FILTER_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'programs', label: 'Startup Programs' },
  { key: 'mentorship', label: 'Mentorship' },
  { key: 'community', label: 'Community' },
  { key: 'events', label: 'Events' },
  { key: 'resources', label: 'Resources' },
]

export default function StartupProgramsPage() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const { data: programs, isLoading, isError, refetch } = useQuery({
    queryKey: ['programs'],
    queryFn: listPrograms,
  })

  const visible = useMemo(() => {
    if (!programs) return []
    if (filter === 'mentorship' || filter === 'community' || filter === 'events' || filter === 'resources') return []
    const q = query.trim().toLowerCase()
    if (!q) return programs
    return programs.filter((p) => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }, [programs, filter, query])

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-fg-muted">
        <Link to="/resources" className="hover:text-fg hover:underline">Resources</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="font-medium text-fg">Startup Programs</span>
      </nav>

      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Rocket className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Startup Programs</h1>
          <p className="mx-auto mt-2 max-w-xl text-fg-secondary">
            Cohorts, mentorship and community to help you explore, build and grow.
          </p>
        </div>
        <div className="w-full max-w-lg">
          <Input
            aria-label="Search programs"
            placeholder="Search programs (e.g. SPARK, IGNITE...)"
            leftIcon={<Search className="size-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <PillTabs items={FILTER_PILLS} value={filter} onChange={setFilter} label="Filter programs" scrollable />
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={2} />
      ) : isError ? (
        <ErrorState title="Couldn't load programs" onRetry={refetch} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Rocket className="size-5" />}
          title={query ? 'No programs match' : 'Nothing here yet'}
          description={query ? 'Try a different search.' : 'More BuildAdda programs are on the way.'}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {visible.map((program) => (
            <Card key={program.key} className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-fg">{program.name}</h2>
                  {!program.applicationOpen && <Badge tone="neutral">Applications closed</Badge>}
                </div>
                <p className="mt-1 font-medium text-fg-brand">{program.tagline}</p>
              </div>
              <p className="text-sm text-fg-secondary">{program.description}</p>
              <ul className="flex flex-col gap-1.5">
                {program.highlights.slice(0, 4).map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-fg-secondary">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-fg-muted">For {program.targetAudience.join(', ')}</p>
              <Link
                to={`/programs/${program.key}`}
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-fg-brand hover:underline"
              >
                Explore {program.name} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
