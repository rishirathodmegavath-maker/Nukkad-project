import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import {
  addDiscussionComment,
  castVote,
  getDiscussion,
  listDiscussionComments,
  toggleDiscussionCommentLike,
} from '@/services/discussions.service'
import { toggleLike as feedToggleLike, toggleSave as feedToggleSave, listReplies } from '@/services/feed.service'
import type { Discussion, DiscussionComment, PostComment } from '@/types'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { splitDiscussionContent } from '@/lib/discussionContent'
import { publisherIdentityLabel } from '@/lib/publisher-identities'
import buildAddaLogoUrl from '@/assets/logo.png'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { HashtagText } from '@/components/domain/HashtagText'
import { VoteControl } from '@/components/domain/VoteControl'
import { AboutDiscussionCard } from '@/components/domain/AboutDiscussionCard'
import { RelatedDiscussionsCard } from '@/components/domain/RelatedDiscussionsCard'
import { toast } from '@/store/toast.store'

type CommentSort = 'newest' | 'mostLiked'

function PlainReplyRow({ reply }: { reply: PostComment }) {
  const { data: author } = useUser(reply.authorId)
  return (
    <div className="flex items-start gap-2.5">
      {author ? <Avatar src={author.avatarUrl} name={author.name} size="xs" /> : <Skeleton className="size-6 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 rounded-xl bg-surface-sunken/70 border border-border/50 px-3.5 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          {author ? (
            <Link to={`/people/${author.id}`} className="text-xs font-bold text-fg hover:underline shrink-0">
              {author.name}
            </Link>
          ) : (
            <Skeleton className="h-3.5 w-16" />
          )}
          <span className="text-xs text-fg-muted shrink-0">{formatRelativeTime(reply.createdAt)}</span>
        </div>
        <p className="text-sm text-fg whitespace-pre-line break-words mt-1 leading-relaxed">{reply.content}</p>
      </div>
    </div>
  )
}

function DiscussionCommentItem({
  comment,
  postId,
  onReply,
}: {
  comment: DiscussionComment
  postId: string
  onReply: (comment: DiscussionComment) => void
}) {
  const { data: author } = useUser(comment.authorId)
  const queryClient = useQueryClient()
  const [repliesOpen, setRepliesOpen] = useState(false)

  const likeMutation = useMutation({
    mutationFn: () => toggleDiscussionCommentLike(postId, comment.id),
    onSuccess: (updated) => {
      queryClient.setQueryData<DiscussionComment[]>(['discussions', postId, 'comments'], (prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
      )
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your like'),
  })

  const repliesQuery = useQuery({
    queryKey: ['discussions', postId, 'comments', comment.id, 'replies'],
    queryFn: () => listReplies(postId, comment.id),
    enabled: repliesOpen,
  })

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        {author ? <Avatar src={author.avatarUrl} name={author.name} size="sm" /> : <Skeleton className="size-8 shrink-0 rounded-full" />}
        <div className="min-w-0 flex-1 rounded-xl bg-surface-sunken/70 border border-border/50 px-3.5 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            {author ? (
              <Link to={`/people/${author.id}`} className="text-xs font-bold text-fg hover:underline shrink-0">
                {author.name}
              </Link>
            ) : (
              <Skeleton className="h-3.5 w-16" />
            )}
            <span className="text-xs text-fg-muted shrink-0">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-fg whitespace-pre-line break-words mt-1 leading-relaxed">{comment.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-9 text-xs font-bold text-fg-muted">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={cn('flex items-center gap-1 hover:text-fg cursor-pointer transition-colors', comment.isLiked && 'text-rose-500 hover:text-rose-500')}
        >
          <Heart className={cn('size-3.5', comment.isLiked && 'fill-current')} />
          {comment.likesCount > 0 && comment.likesCount}
        </button>
        <button type="button" onClick={() => onReply(comment)} className="hover:text-fg cursor-pointer transition-colors">
          Reply
        </button>
        {comment.replyCount > 0 && (
          <button type="button" onClick={() => setRepliesOpen((o) => !o)} className="hover:text-fg cursor-pointer transition-colors">
            {repliesOpen ? 'Hide replies' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
          </button>
        )}
      </div>
      {repliesOpen && (
        <div className="pl-9 flex flex-col gap-2.5 mt-1">
          {repliesQuery.isLoading ? (
            <Skeleton className="h-8 w-full rounded-xl" />
          ) : (
            repliesQuery.data?.map((r) => <PlainReplyRow key={r.id} reply={r} />)
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A discussion's own page — replies, votes and follow state, not the generic PostCard/PostDetailPage
 * every other post kind shares. Liking, saving and adding/deleting a top-level reply all still go
 * through the plain Feed endpoints under the hood (a discussion is still a Post); only the vote,
 * follow, view-count and per-reply-like pieces are genuinely new.
 *
 * Scope note: reply-likes only exist on top-level comments in this pass — a reply-to-a-reply (which
 * the Feed's own flattening rule re-parents onto its top ancestor anyway) is shown read-only, since
 * giving it its own like button would need a second batched like-lookup this page doesn't have yet.
 */
export default function DiscussionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [commentSort, setCommentSort] = useState<CommentSort>('newest')
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<DiscussionComment | null>(null)
  const { data: replyAuthor } = useUser(replyingTo?.authorId)

  const { data: discussion, isLoading, isError, refetch } = useQuery({
    queryKey: ['discussions', id],
    queryFn: () => getDiscussion(id!),
    enabled: !!id,
    retry: false,
  })

  const voteMutation = useMutation({
    mutationFn: (direction: 'up' | 'down') => castVote(id!, direction),
    onSuccess: (updated) => queryClient.setQueryData(['discussions', id], updated),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record your vote'),
  })

  const likeMutation = useMutation({
    mutationFn: () => feedToggleLike(id!),
    onSuccess: (updatedPost) =>
      queryClient.setQueryData<Discussion>(['discussions', id], (prev) =>
        prev ? { ...prev, isLiked: updatedPost.isLiked ?? false, likesCount: updatedPost.likesCount } : prev,
      ),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update like'),
  })

  const saveMutation = useMutation({
    mutationFn: () => feedToggleSave(id!),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<Discussion>(['discussions', id], (prev) => (prev ? { ...prev, isSaved: updatedPost.isSaved ?? false } : prev))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })

  const commentsQuery = useQuery({
    queryKey: ['discussions', id, 'comments'],
    queryFn: () => listDiscussionComments(id!),
    enabled: !!id,
  })

  const addCommentMutation = useMutation({
    mutationFn: () => addDiscussionComment(id!, text.trim(), replyingTo?.id),
    onSuccess: () => {
      setText('')
      setReplyingTo(null)
      queryClient.invalidateQueries({ queryKey: ['discussions', id, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['discussions', id] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post your reply'),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-busy="true">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !discussion) {
    return <ErrorState title="Couldn't load this discussion" onRetry={refetch} />
  }

  const { title, preview } = splitDiscussionContent(discussion.content)
  const comments = commentsQuery.data ?? []
  const sortedComments = [...comments].sort((a, b) =>
    commentSort === 'mostLiked'
      ? b.likesCount - a.likesCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  function submitComment() {
    if (!text.trim() || addCommentMutation.isPending) return
    addCommentMutation.mutate()
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <Link to="/discussions" className="inline-flex items-center gap-2 text-sm font-semibold text-fg-secondary hover:text-fg -ml-1">
          <ArrowLeft className="size-4" />
          Back to Discussions
        </Link>

        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <VoteControl
              size="md"
              netScore={discussion.netScore}
              myVote={discussion.myVote}
              pending={voteMutation.isPending}
              onVote={(direction) => voteMutation.mutate(direction)}
            />
            <div className="min-w-0 flex-1">
              <Badge tone="primary">{discussion.topicLabel}</Badge>
              <h1 className="mt-2 text-xl font-bold leading-snug text-fg [overflow-wrap:anywhere]">{title}</h1>
              <DiscussionAuthorLine discussion={discussion} />
            </div>
          </div>

          {preview && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">
              <HashtagText text={preview} />
            </p>
          )}

          {discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {discussion.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 border-t border-border/70 pt-3">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-secondary hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors',
                discussion.isLiked && 'text-rose-500 hover:text-rose-500',
              )}
              aria-pressed={discussion.isLiked}
            >
              <Heart className={cn('size-4.5', discussion.isLiked && 'fill-current')} />
              {discussion.likesCount > 0 && discussion.likesCount}
            </button>
            <span className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-secondary">
              <MessageCircle className="size-4.5" />
              {discussion.commentsCount}
            </span>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={cn(
                'ml-auto flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-secondary hover:text-amber-500 hover:bg-surface-hover cursor-pointer transition-colors',
                discussion.isSaved && 'text-amber-500 hover:text-amber-500',
              )}
              aria-pressed={discussion.isSaved}
              aria-label={discussion.isSaved ? 'Remove from saved' : 'Save'}
            >
              <Bookmark className={cn('size-4.5', discussion.isSaved && 'fill-current')} />
            </button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-fg">
              {comments.length === 0 ? 'No replies yet' : comments.length === 1 ? '1 Reply' : `${comments.length} Replies`}
            </h2>
            {comments.length > 1 && (
              <div className="w-40">
                <Select aria-label="Sort replies" value={commentSort} onChange={(e) => setCommentSort(e.target.value as CommentSort)}>
                  <option value="newest">Newest</option>
                  <option value="mostLiked">Most liked</option>
                </Select>
              </div>
            )}
          </div>

          {commentsQuery.isLoading ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : sortedComments.length > 0 ? (
            <div className="flex flex-col gap-4">
              {sortedComments.map((c) => (
                <DiscussionCommentItem key={c.id} comment={c} postId={discussion.id} onReply={setReplyingTo} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Be the first to reply.</p>
          )}

          <div className="flex flex-col gap-2 border-t border-border/70 pt-3">
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-sunken px-3 py-1.5 text-xs">
                <span className="truncate text-fg-muted">
                  Replying to <span className="font-bold text-fg">{replyAuthor?.name ?? '…'}</span>
                </span>
                <button type="button" onClick={() => setReplyingTo(null)} className="shrink-0 text-fg-muted hover:text-fg cursor-pointer">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="xs" />
              <input
                id={`discussion-reply-${discussion.id}`}
                name={`discussion-reply-${discussion.id}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitComment()
                  }
                }}
                placeholder={replyingTo ? `Reply to ${replyAuthor?.name ?? 'comment'}…` : 'Write a reply…'}
                className="flex-1 rounded-full border border-border/80 bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={!text.trim() || addCommentMutation.isPending}
                className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-30 cursor-pointer transition-all active:scale-95 shadow-xs"
                aria-label="Post reply"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <AboutDiscussionCard discussion={discussion} />
        <RelatedDiscussionsCard postId={discussion.id} />
      </div>
    </div>
  )
}

function DiscussionAuthorLine({ discussion }: { discussion: Discussion }) {
  const { data: author } = useUser(discussion.postedAsPlatform ? undefined : discussion.authorId)
  const publisherLabel = publisherIdentityLabel(discussion.publisherIdentity)
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-fg-muted">
      {discussion.postedAsPlatform ? (
        <Avatar src={buildAddaLogoUrl} name={publisherLabel} size="xs" />
      ) : author ? (
        <Avatar src={author.avatarUrl} name={author.name} size="xs" />
      ) : (
        <Skeleton className="size-6 rounded-full" />
      )}
      {discussion.postedAsPlatform ? (
        <span className="font-semibold text-fg">{publisherLabel}</span>
      ) : author ? (
        <Link to={`/people/${author.id}`} className="font-semibold text-fg hover:underline">
          {author.name}
        </Link>
      ) : (
        <Skeleton className="h-4 w-20" />
      )}
      <span aria-hidden="true">·</span>
      <span>{formatRelativeTime(discussion.createdAt)}</span>
    </p>
  )
}
