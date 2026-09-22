import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessagesSquare } from 'lucide-react'
import { listRelatedDiscussions } from '@/services/discussions.service'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/** Other discussions worth reading next — same curated topic or a shared hashtag (see
 *  DiscussionService#listRelated), most recent first. Never an ML/embedding-based "relatedness". */
export function RelatedDiscussionsCard({ postId }: { postId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['discussions', postId, 'related'],
    queryFn: () => listRelatedDiscussions(postId, 5),
  })

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-2xs">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <MessagesSquare className="size-4 text-fg-brand" aria-hidden="true" />
          Related Discussions
        </h2>
      </div>
      <div className="px-2 pb-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <ul>
            {data!.map((d) => (
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
        )}
      </div>
    </Card>
  )
}
