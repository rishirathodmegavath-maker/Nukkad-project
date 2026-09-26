import { useQuery } from '@tanstack/react-query'
import { listEvents } from '@/services/events.service'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { HomeEventRow } from '@/components/domain/HomeEventRow'

/** A chapter's next few events, reusing the same compact row Home's own "Upcoming events" section
 *  uses — real data via `listEvents({chapterId, upcoming: true})`, already used by this page's
 *  Events tab. `onViewAll` switches the page's own tab rather than navigating away. */
export function UpcomingEventsCard({ chapterId, onViewAll }: { chapterId: string; onViewAll: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'chapter', chapterId, 'upcoming'],
    queryFn: () => listEvents({ chapterId, upcoming: true, size: 3 }),
  })

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-fg">Upcoming Events</h2>
        <button type="button" onClick={onViewAll} className="text-xs font-semibold text-fg-brand hover:underline cursor-pointer">
          View all
        </button>
      </div>
      {isLoading ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-4">
          {data.map((event) => (
            <HomeEventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-fg-muted">No upcoming events for this chapter.</p>
      )}
    </Card>
  )
}
