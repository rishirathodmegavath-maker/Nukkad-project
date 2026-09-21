import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Plus } from 'lucide-react'
import { listEvents } from '@/services/events.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { EventCard } from '@/components/domain/EventCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'

export default function EventsListPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const [mineOnly, setMineOnly] = useState(false)
  const { data: currentUser } = useCurrentUser()
  const isFiltering = query.trim().length > 0

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', upcomingOnly, mineOnly, query, currentUser?.id],
    queryFn: () =>
      listEvents({
        upcoming: upcomingOnly,
        organizerUserId: mineOnly ? currentUser?.id : undefined,
        query: query || undefined,
      }),
    enabled: !mineOnly || !!currentUser,
  })

  return (
    <div>
      <PageHeader
        title="Events"
        description="Demo nights, meetups, and your own meets — hosted by anyone."
        action={
          <Link to="/events/new" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden="true" />
            Start an event
          </Link>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Filter events by title…">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-muted">When</span>
            <PillTabs
              label="When"
              items={[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'all', label: 'All events' },
              ]}
              value={upcomingOnly ? 'upcoming' : 'all'}
              onChange={(k) => setUpcomingOnly(k === 'upcoming')}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-muted">Organizer</span>
            <PillTabs
              tone="soft"
              label="Organizer"
              items={[
                { key: 'all', label: 'All organizers' },
                { key: 'mine', label: 'Hosted by me' },
              ]}
              value={mineOnly ? 'mine' : 'all'}
              onChange={(k) => setMineOnly(k === 'mine')}
            />
          </div>
        </div>
      </SearchFilterBar>

      {isLoading ? (
        <CardSkeletonGrid count={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load events" onRetry={refetch} />
      ) : events && events.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} headingAs="h2" />
          ))}
        </div>
      ) : isFiltering ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="No events match your search"
          description="Try a different search term, or clear it to browse all events."
          action={
            <Button size="sm" variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : mineOnly ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="You haven't hosted any events yet"
          description="Events you organize will show up here."
          action={
            <Link to="/events/new" className={buttonClasses({ size: 'sm' })}>
              <Plus className="size-3.5" aria-hidden="true" />
              Host an event
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title={upcomingOnly ? 'No upcoming events scheduled' : 'No events found'}
          description={
            upcomingOnly
              ? 'Be the first to host a demo night, founder meetup, or workshop for your local ecosystem.'
              : 'Events organized by members and university chapters will show up here.'
          }
          action={
            <Link to="/events/new" className={buttonClasses({ size: 'sm' })}>
              <Plus className="size-3.5" aria-hidden="true" />
              Host an event
            </Link>
          }
        />
      )}
    </div>
  )
}
