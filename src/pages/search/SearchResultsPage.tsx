import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, Users, Lightbulb, Rocket, Briefcase, CalendarDays, ArrowRight } from 'lucide-react'
import { listUsers } from '@/services/users.service'
import { listIdeas } from '@/services/ideas.service'
import { listStartups } from '@/services/startups.service'
import { listOpportunities } from '@/services/opportunities.service'
import { listEvents } from '@/services/events.service'
import { PersonCard } from '@/components/domain/PersonCard'
import { IdeaCard } from '@/components/domain/IdeaCard'
import { StartupCard } from '@/components/domain/StartupCard'
import { OpportunityCard } from '@/components/domain/OpportunityCard'
import { EventCard } from '@/components/domain/EventCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const PREVIEW_COUNT = 3

function ResultSection({
  title,
  icon,
  count,
  isLoading,
  viewAllHref,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  isLoading: boolean
  viewAllHref: string
  children: React.ReactNode
}) {
  if (!isLoading && count === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-fg-secondary">
            {title}
            {!isLoading && ` (${count})`}
          </h2>
        </div>
        {!isLoading && count > PREVIEW_COUNT && (
          <Link to={viewAllHref} className="flex items-center gap-1 text-xs font-semibold text-fg hover:underline">
            View all <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      {isLoading ? <CardSkeletonGrid count={PREVIEW_COUNT} /> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>}
    </div>
  )
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const trimmed = (searchParams.get('q') ?? '').trim()

  const filters = useMemo(() => ({ query: trimmed || undefined }), [trimmed])

  const peopleQuery = useQuery({
    queryKey: ['search', 'people', trimmed],
    queryFn: () => listUsers(filters),
    enabled: !!trimmed,
  })
  const ideasQuery = useQuery({
    queryKey: ['search', 'ideas', trimmed],
    queryFn: () => listIdeas(filters),
    enabled: !!trimmed,
  })
  const startupsQuery = useQuery({
    queryKey: ['search', 'startups', trimmed],
    queryFn: () => listStartups(filters),
    enabled: !!trimmed,
  })
  const opportunitiesQuery = useQuery({
    queryKey: ['search', 'opportunities', trimmed],
    queryFn: () => listOpportunities(filters),
    enabled: !!trimmed,
  })
  const eventsQuery = useQuery({
    queryKey: ['search', 'events', trimmed],
    queryFn: () => listEvents(filters),
    enabled: !!trimmed,
  })

  const isLoading =
    peopleQuery.isLoading || ideasQuery.isLoading || startupsQuery.isLoading || opportunitiesQuery.isLoading || eventsQuery.isLoading
  const totalCount =
    (peopleQuery.data?.length ?? 0) +
    (ideasQuery.data?.length ?? 0) +
    (startupsQuery.data?.length ?? 0) +
    (opportunitiesQuery.data?.length ?? 0) +
    (eventsQuery.data?.length ?? 0)
  const encodedQuery = encodeURIComponent(trimmed)

  return (
    <div>
      <PageHeader
        title={trimmed ? `Search results for "${trimmed}"` : 'Search'}
        description="Use the search bar at the top of the page to search across people, ideas, startups, opportunities and events."
      />

      {!trimmed ? (
        <EmptyState icon={<SearchIcon className="size-5" />} title="Search Buildadda" description="Type something in the search bar above to get started." />
      ) : (
        <>
          <ResultSection
            title="People"
            icon={<Users className="size-4 text-fg-secondary" />}
            count={peopleQuery.data?.length ?? 0}
            isLoading={peopleQuery.isLoading}
            viewAllHref={`/people?q=${encodedQuery}`}
          >
            {peopleQuery.data?.slice(0, PREVIEW_COUNT).map((user) => <PersonCard key={user.id} user={user} />)}
          </ResultSection>

          <ResultSection
            title="Ideas"
            icon={<Lightbulb className="size-4 text-fg-secondary" />}
            count={ideasQuery.data?.length ?? 0}
            isLoading={ideasQuery.isLoading}
            viewAllHref={`/ideas?q=${encodedQuery}`}
          >
            {ideasQuery.data?.slice(0, PREVIEW_COUNT).map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
          </ResultSection>

          <ResultSection
            title="Startups"
            icon={<Rocket className="size-4 text-fg-secondary" />}
            count={startupsQuery.data?.length ?? 0}
            isLoading={startupsQuery.isLoading}
            viewAllHref={`/startups?q=${encodedQuery}`}
          >
            {startupsQuery.data?.slice(0, PREVIEW_COUNT).map((startup) => <StartupCard key={startup.id} startup={startup} />)}
          </ResultSection>

          <ResultSection
            title="Opportunities"
            icon={<Briefcase className="size-4 text-fg-secondary" />}
            count={opportunitiesQuery.data?.length ?? 0}
            isLoading={opportunitiesQuery.isLoading}
            viewAllHref={`/opportunities?q=${encodedQuery}`}
          >
            {opportunitiesQuery.data?.slice(0, PREVIEW_COUNT).map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)}
          </ResultSection>

          <ResultSection
            title="Events"
            icon={<CalendarDays className="size-4 text-fg-secondary" />}
            count={eventsQuery.data?.length ?? 0}
            isLoading={eventsQuery.isLoading}
            viewAllHref={`/events?q=${encodedQuery}`}
          >
            {eventsQuery.data?.slice(0, PREVIEW_COUNT).map((event) => <EventCard key={event.id} event={event} />)}
          </ResultSection>

          {!isLoading && totalCount === 0 && (
            <EmptyState
              icon={<SearchIcon className="size-5" />}
              title={`No results for "${trimmed}"`}
              description="Try a different search term."
            />
          )}
        </>
      )}
    </div>
  )
}
