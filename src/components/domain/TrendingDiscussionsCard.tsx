import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { listDiscussions } from '@/services/discussions.service'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/** The 5 highest-scoring recent discussions (see DiscussionService#trendingPage — real votes+replies,
 *  never a fabricated "hot" ranking), reusing the same /discussions?sort=trending the main list's
 *  Trending tab uses. */
export function TrendingDiscussionsCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['discussions', 'trending', 'sidebar'],
    queryFn: () => listDiscussions({ sort: 'trending', size: 5 }),
    staleTime: 60_000,
  })

  const discussions = data?.content ?? []

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-2xs">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Flame className="size-4 text-orange-500" aria-hidden="true" />
          Trending Discussions
        </h2>
      </div>

      <div className="px-2 pb-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-3 py-3 text-xs text-fg-muted">Couldn't load trending discussions right now.</p>
        ) : discussions.length > 0 ? (
          <ul>
            {discussions.map((d) => (
              <li key={d.id}>
                <Link to={`/discussions/${d.id}`} className="group flex flex-col gap-0.5 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover">
                  <span className="truncate text-sm font-semibold text-fg group-hover:text-fg-brand [overflow-wrap:anywhere]">
                    {d.content.trim().split('\n')[0].slice(0, 60) || 'Discussion'}
                  </span>
                  <span className="text-xs text-fg-muted">{d.commentsCount === 1 ? '1 reply' : `${d.commentsCount} replies`}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-3 text-xs leading-relaxed text-fg-muted">No discussions yet. Be the first to start one.</p>
        )}
      </div>
    </Card>
  )
}
