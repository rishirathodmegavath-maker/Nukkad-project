import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import { listTopics } from '@/services/discussions.service'
import { discussionTopicMeta } from '@/lib/discussionTopicMeta'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

/** Real, all-time counts per curated topic (see DiscussionService#listTopics) — every topic shows,
 *  even one nobody has used yet, so the list never looks arbitrarily incomplete. */
export function PopularTopicsCard() {
  const [searchParams] = useSearchParams()
  const activeTopic = searchParams.get('topic')
  const { data: topics, isLoading, isError } = useQuery({ queryKey: ['discussions', 'topics'], queryFn: listTopics, staleTime: 60_000 })

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-2xs">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Layers className="size-4 text-fg-brand" aria-hidden="true" />
          Popular Topics
        </h2>
      </div>

      <div className="px-2 pb-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : isError || !topics ? (
          <p className="px-3 py-3 text-xs text-fg-muted">Couldn't load topics right now.</p>
        ) : (
          <ul>
            {topics.map((t) => {
              const meta = discussionTopicMeta(t.topic)
              const Icon = meta.icon
              return (
                <li key={t.topic}>
                  <Link
                    to={`/discussions?topic=${t.topic}`}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover',
                      activeTopic === t.topic && 'bg-surface-hover',
                    )}
                  >
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', meta.tone)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg group-hover:text-fg-brand">{t.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-fg-muted">{t.count}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
