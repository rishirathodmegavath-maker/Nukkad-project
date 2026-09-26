import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Eye, MessageCircle } from 'lucide-react'
import type { Discussion } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { VoteControl } from '@/components/domain/VoteControl'
import { castVote } from '@/services/discussions.service'
import { useUser } from '@/hooks/useUser'
import { publisherIdentityLabel } from '@/lib/publisher-identities'
import { formatRelativeTime } from '@/lib/utils'
import { formatCompactNumber } from '@/lib/startup-meta'
import { splitDiscussionContent } from '@/lib/discussionContent'
import { toast } from '@/store/toast.store'

/**
 * One discussion in the Discussions list — a conversation to open, not a post to react to.
 * Deliberately not PostCard: no like/share/save action bar, no generic "Discussion" badge (every
 * card on this page is already a discussion). Opening it (`/discussions/:id`) reaches the full
 * detail page with real replies, votes and follow state — this component only changes how a
 * discussion is presented in the list.
 *
 * Only real fields are shown: reply count, view count and net vote score are all genuine server
 * numbers (see DiscussionDto) — there is no fabricated "participants online" or similar here.
 */
export function DiscussionCard({ discussion }: { discussion: Discussion }) {
  const queryClient = useQueryClient()
  const { data: author } = useUser(discussion.postedAsPlatform ? undefined : discussion.authorId)
  const { title, preview } = splitDiscussionContent(discussion.content)
  const replyLabel = discussion.commentsCount === 0 ? 'No replies yet' : discussion.commentsCount === 1 ? '1 reply' : `${discussion.commentsCount} replies`

  const voteMutation = useMutation({
    mutationFn: (direction: 'up' | 'down') => castVote(discussion.id, direction),
    onSuccess: (updated) => {
      queryClient.setQueriesData<{ content: Discussion[] } | undefined>({ queryKey: ['discussions'], exact: false }, (data) =>
        data ? { ...data, content: data.content.map((d) => (d.id === updated.id ? updated : d)) } : data,
      )
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record your vote'),
  })

  return (
    <Card
      interactive
      padding="none"
      className="group flex gap-3 overflow-hidden border border-border/80 p-4 shadow-xs transition-all hover:border-border-strong hover:shadow-sm sm:p-5"
    >
      <div className="pt-0.5">
        <VoteControl
          netScore={discussion.netScore}
          myVote={discussion.myVote}
          pending={voteMutation.isPending}
          onVote={(direction) => voteMutation.mutate(direction)}
        />
      </div>

      <Link to={`/discussions/${discussion.id}`} className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[15px] font-bold text-fg leading-snug [overflow-wrap:anywhere]">{title}</h3>
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-fg-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>

        {preview && <p className="text-sm text-fg-secondary leading-relaxed line-clamp-2 [overflow-wrap:anywhere]">{preview}</p>}

        {(discussion.topic || discussion.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="primary">{discussion.topicLabel}</Badge>
            {discussion.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs text-fg-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            {discussion.postedAsPlatform ? (
              <span className="truncate font-semibold text-fg-secondary">{publisherIdentityLabel(discussion.publisherIdentity)}</span>
            ) : author ? (
              <span className="truncate font-semibold text-fg-secondary">{author.name}</span>
            ) : (
              <Skeleton className="h-3.5 w-20" />
            )}
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{formatRelativeTime(discussion.createdAt)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-fg-secondary">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {replyLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {formatCompactNumber(discussion.viewsCount)}
            </span>
          </span>
        </div>
      </Link>
    </Card>
  )
}
