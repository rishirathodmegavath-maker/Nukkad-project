import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessagesSquare, Plus, X } from 'lucide-react'
import { listDiscussions } from '@/services/discussions.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { DiscussionCard } from '@/components/domain/DiscussionCard'
import { CreateDiscussionModal } from '@/components/domain/CreateDiscussionModal'
import { PopularTopicsCard } from '@/components/domain/PopularTopicsCard'
import { TrendingDiscussionsCard } from '@/components/domain/TrendingDiscussionsCard'
import { DiscussionStatsCard } from '@/components/domain/DiscussionStatsCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { DISCUSSION_TOPICS } from '@/lib/discussionTopicMeta'
import { Avatar } from '@/components/ui/Avatar'
import { PillTabs } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { DiscussionSort } from '@/types'

const SORT_TABS: { key: DiscussionSort; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
  { key: 'unanswered', label: 'Unanswered' },
  { key: 'following', label: 'Following' },
  { key: 'mine', label: 'My Discussions' },
]

/**
 * Discussions: a real forum on top of the Feed's own posts, not a filtered view of it — see
 * DiscussionCard/DiscussionService for what makes a discussion different from a plain post (a
 * topic, a vote score, a view count, a follow state, a participant count). Every sort tab is a real
 * query (see DiscussionService#list): Unanswered is commentsCount=0, Following is discussions the
 * viewer actually follows, Trending scores real recent votes+replies — none of it fabricated.
 */
export default function DiscussionsPage() {
  const { data: currentUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = (searchParams.get('sort') as DiscussionSort) || 'trending'
  const topic = searchParams.get('topic') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const [page, setPage] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)

  useEffect(() => setPage(0), [sort, topic, tag])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['discussions', 'list', sort, topic, tag, page],
    queryFn: () => listDiscussions({ sort, topic: topic || undefined, tag: tag || undefined, page, size: 10 }),
  })

  function setSort(next: string) {
    const params = new URLSearchParams(searchParams)
    params.set('sort', next)
    setSearchParams(params)
  }

  function setTopic(next: string) {
    const params = new URLSearchParams(searchParams)
    if (!next) params.delete('topic')
    else params.set('topic', next)
    setSearchParams(params)
  }

  function clearTag() {
    const params = new URLSearchParams(searchParams)
    params.delete('tag')
    setSearchParams(params)
  }

  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        <PageHeader
          title="Discussions"
          description="Start a conversation with builders across BuildAdda, or join one that is already going."
        />

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex items-center gap-3 rounded-lg border border-border/80 bg-surface p-4 text-left shadow-xs transition-all duration-150 hover:border-border-strong active:scale-[0.995] cursor-pointer"
        >
          <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="md" />
          <span className="flex-1 min-w-0 truncate text-sm text-fg-muted">Start a new discussion — ask a question, share an opinion…</span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Plus className="size-4.5" />
          </span>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PillTabs tone="soft" scrollable label="Sort discussions" items={SORT_TABS} value={sort} onChange={setSort} />
          <div className="w-full sm:w-52">
            <Select aria-label="Filter by topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All topics</option>
              {DISCUSSION_TOPICS.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {tag && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-500/20 bg-brand-500/10 px-4 py-2.5">
            <p className="text-sm text-fg">
              Discussions tagged <span className="font-bold">#{tag}</span>
            </p>
            <button
              type="button"
              onClick={clearTag}
              aria-label={`Stop filtering by #${tag}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : isError || !data ? (
          <ErrorState title="Couldn't load discussions" onRetry={refetch} />
        ) : data.content.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {data.content.map((d) => (
                <DiscussionCard key={d.id} discussion={d} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        ) : sort === 'mine' ? (
          <EmptyState icon={<MessagesSquare className="size-6" />} title="You haven't started a discussion yet" description="Be the first — ask the community something." />
        ) : sort === 'following' ? (
          <EmptyState icon={<MessagesSquare className="size-6" />} title="You're not following any discussions yet" description="Open one and follow it to see updates here." />
        ) : sort === 'unanswered' ? (
          <EmptyState icon={<MessagesSquare className="size-6" />} title="Nothing unanswered right now" description="Every discussion has at least one reply." />
        ) : (
          <EmptyState icon={<MessagesSquare className="size-6" />} title="No discussions yet" description="Be the first to start one." />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
        <PopularTopicsCard />
        <TrendingDiscussionsCard />
        <DiscussionStatsCard />
      </div>

      <CreateDiscussionModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  )
}
