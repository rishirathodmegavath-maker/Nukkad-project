import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { getDiscussionStats } from '@/services/discussions.service'
import { formatCompactNumber } from '@/lib/startup-meta'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/** Real platform-wide totals (see DiscussionService#getStats) — never placeholder numbers. */
export function DiscussionStatsCard() {
  const { data, isLoading } = useQuery({ queryKey: ['discussions', 'stats'], queryFn: getDiscussionStats, staleTime: 60_000 })

  return (
    <Card className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-bold text-fg">
        <Users className="size-4 text-fg-brand" aria-hidden="true" />A community of builders, helping builders.
      </p>
      {isLoading || !data ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums text-fg">{formatCompactNumber(data.totalDiscussions)}</p>
            <p className="text-xs text-fg-muted">Discussions</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-fg">{formatCompactNumber(data.totalReplies)}</p>
            <p className="text-xs text-fg-muted">Replies</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-fg">{formatCompactNumber(data.totalParticipants)}</p>
            <p className="text-xs text-fg-muted">Builders</p>
          </div>
        </div>
      )}
    </Card>
  )
}
