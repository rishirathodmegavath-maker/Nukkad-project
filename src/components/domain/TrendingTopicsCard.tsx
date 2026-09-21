import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Flame, Hash } from 'lucide-react'
import { listTrendingTopics } from '@/services/feed.service'
import { feedTagPath } from '@/lib/hashtags'
import { pluralize } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

const PREVIEW = 5
const ALL = 20

/**
 * Trending Topics: the hashtags most used lately in the posts the viewer can read, each linking to the feed for that
 * tag. The list is real: it is counted from what members actually wrote, so it is empty until people use #hashtags.
 */
export function TrendingTopicsCard() {
  const [showAll, setShowAll] = useState(false)
  const { data: topics, isLoading, isError } = useQuery({
    queryKey: ['feed', 'trending-topics'],
    queryFn: () => listTrendingTopics(ALL),
    staleTime: 60_000,
  })

  const shown = topics ? (showAll ? topics : topics.slice(0, PREVIEW)) : []

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-2xs">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Flame className="size-4 text-orange-500" aria-hidden="true" />
          Trending Topics
        </h2>
        {topics && topics.length > PREVIEW && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-fg-brand hover:underline cursor-pointer"
          >
            {showAll ? 'Show less' : 'View all'}
            {!showAll && <ArrowRight className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div className="px-2 pb-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-3 py-3 text-xs text-fg-muted">Couldn’t load trending topics right now.</p>
        ) : shown.length > 0 ? (
          <ul>
            {shown.map((topic) => (
              <li key={topic.tag}>
                <Link
                  to={feedTagPath(topic.tag)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-fg-brand">
                    <Hash className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg group-hover:text-fg-brand">{topic.tag}</span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">{pluralize(topic.postCount, 'post')}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-3 text-xs leading-relaxed text-fg-muted">
            No trending topics yet. Add #hashtags to your posts and the most used ones show up here.
          </p>
        )}
      </div>
    </Card>
  )
}
