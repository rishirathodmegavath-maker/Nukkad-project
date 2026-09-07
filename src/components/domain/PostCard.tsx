import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  MessageCircleOff,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  MoreHorizontal,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Send,
  Bookmark,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Post, PostAttachment, PostComment } from '@/types'
import type { Page } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/DropdownMenu'
import { ShareModal } from '@/components/domain/ShareModal'
import { LikesModal } from '@/components/domain/LikesModal'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatRelativeTime, cn } from '@/lib/utils'
import { typeMeta } from '@/lib/postTypeMeta'
import { toast } from '@/store/toast.store'
import * as feedService from '@/services/feed.service'

const CONTENT_CLAMP_CHARS = 280

function AttachmentCarousel({
  attachments,
  isLiked,
  onDoubleTapLike,
}: {
  attachments: PostAttachment[]
  isLiked?: boolean
  onDoubleTapLike?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [burstId, setBurstId] = useState(0)
  const [muted, setMuted] = useState(true)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const media = attachments.filter((a) => a.kind === 'image' || a.kind === 'video')
  const docs = attachments.filter((a) => a.kind === 'pdf')
  const current = media[index]

  // Autoplay (muted, as browsers require) once at least half the video is actually on screen
  // while scrolling the feed, and pause again once it drops back below that.
  useEffect(() => {
    const el = videoRef.current
    if (!el || current?.kind !== 'video') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [current?.url, current?.kind])

  // `dblclick` doesn't reliably synthesize from two quick taps on touch devices, so single vs.
  // double tap is disambiguated by hand: the first tap waits briefly to see if a second one
  // follows before acting, matching how every feed app treats tap-to-play vs. double-tap-to-like.
  function handleMediaTap() {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      setBurstId((n) => n + 1)
      if (!isLiked) onDoubleTapLike?.()
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      const el = videoRef.current
      if (!el) return
      if (el.paused) el.play().catch(() => {})
      else el.pause()
    }, 280)
  }

  return (
    <div className="flex flex-col gap-2.5">
      {media.length > 0 && (
        <div className="relative w-full aspect-[16/10] sm:aspect-video bg-surface-sunken rounded-xl overflow-hidden group shadow-2xs select-none">
          {current.kind === 'video' ? (
            <video ref={videoRef} src={current.url} muted={muted} playsInline controls className="size-full object-contain bg-black" />
          ) : (
            <img src={current.url} alt="" className="size-full object-cover" loading="lazy" />
          )}

          {/* Transparent tap-catcher, sitting in front of the media rather than handling taps on
              the media itself — a double-click landing directly on a <video> element triggers the
              browser's own native fullscreen toggle, which this avoids entirely. Left clear of the
              video's native controls strip at the bottom so play/seek/volume/fullscreen still work.
              touch-action: manipulation stops mobile browsers from treating the second tap as a
              double-tap-to-zoom gesture instead of letting our own handler see it. */}
          <div
            className={cn('absolute inset-x-0 top-0 cursor-pointer touch-manipulation', current.kind === 'video' ? 'bottom-9' : 'bottom-0')}
            onClick={handleMediaTap}
          />

          {current.kind === 'video' && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="absolute top-3 left-3 flex size-8.5 items-center justify-center rounded-full bg-neutral-900/75 text-white shadow-md backdrop-blur-xs hover:bg-neutral-900/90 transition-all cursor-pointer"
              aria-label={muted ? 'Unmute video' : 'Mute video'}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          )}

          {burstId > 0 && (
            <div key={burstId} className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="size-20 text-white fill-white drop-shadow-lg animate-heart-burst" />
            </div>
          )}

          {media.length > 1 && (
            <>
              <span className="absolute top-3 right-3 rounded-full bg-neutral-900/75 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 shadow-xs">
                {index + 1}/{media.length}
              </span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex size-8.5 items-center justify-center rounded-full bg-surface/90 text-fg shadow-md backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface transition-all cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {index < media.length - 1 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex size-8.5 items-center justify-center rounded-full bg-surface/90 text-fg shadow-md backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface transition-all cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-900/40 backdrop-blur-xs px-2 py-1 rounded-full">
                {media.map((m, i) => (
                  <span
                    key={m.id}
                    className={cn(
                      'transition-all duration-200',
                      i === index ? 'w-4 h-1.5 rounded-full bg-white' : 'size-1.5 rounded-full bg-white/60',
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {docs.map((doc) => (
        <a
          key={doc.id}
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface-sunken/40 px-4 py-3 hover:bg-surface-hover hover:border-border-strong transition-all shadow-2xs group"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 shrink-0 border border-accent-500/20">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg truncate group-hover:text-brand-600 transition-colors">
              {doc.fileName ?? 'Document.pdf'}
            </p>
            <p className="text-xs text-fg-muted">Click to view or download PDF</p>
          </div>
          <Download className="size-4 text-fg-muted group-hover:text-fg shrink-0 transition-colors" />
        </a>
      ))}
    </div>
  )
}

function CommentItem({
  comment,
  post,
  isReply = false,
  onReply,
}: {
  comment: PostComment
  post: Post
  isReply?: boolean
  onReply: (comment: PostComment) => void
}) {
  const { data: author } = useUser(comment.authorId)
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const [repliesOpen, setRepliesOpen] = useState(false)

  const canDelete = !!currentUser && (currentUser.id === comment.authorId || currentUser.id === post.authorId)

  const deleteMutation = useMutation({
    mutationFn: () => feedService.deleteComment(post.id, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', post.id, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Comment deleted')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete comment'),
  })

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ['feed', post.id, 'comments', comment.id, 'replies'],
    queryFn: () => feedService.listReplies(post.id, comment.id),
    enabled: repliesOpen,
  })

  return (
    <div className="flex flex-col gap-1">
      <div className="group/comment flex items-start gap-2.5">
        {author ? (
          <Avatar src={author.avatarUrl} name={author.name} size="xs" />
        ) : (
          <Skeleton className="size-6 rounded-full shrink-0" />
        )}
        <div className="min-w-0 flex-1 rounded-2xl bg-surface-sunken/70 border border-border/50 px-3.5 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            {author ? (
              <Link to={`/people/${author.id}`} className="text-xs font-bold text-fg hover:underline shrink-0">
                {author.name}
              </Link>
            ) : (
              <Skeleton className="h-3.5 w-16" />
            )}
            <span className="text-[10px] text-fg-muted shrink-0">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-fg whitespace-pre-line break-words mt-1 leading-relaxed">{comment.content}</p>
        </div>
        {canDelete && (
          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg text-fg-muted opacity-0 group-hover/comment:opacity-100 hover:bg-surface-hover hover:text-fg cursor-pointer transition-all"
                aria-label="Comment options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            }
          >
            <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => deleteMutation.mutate()}>
              Delete
            </DropdownItem>
          </DropdownMenu>
        )}
      </div>
      <div className="flex items-center gap-3 pl-9 text-[11px] font-bold text-fg-muted">
        <button type="button" onClick={() => onReply(comment)} className="hover:text-fg cursor-pointer transition-colors">
          Reply
        </button>
        {!isReply && comment.replyCount > 0 && (
          <button
            type="button"
            onClick={() => setRepliesOpen((o) => !o)}
            className="hover:text-fg cursor-pointer transition-colors"
          >
            {repliesOpen ? 'Hide replies' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
          </button>
        )}
      </div>
      {repliesOpen && (
        <div className="pl-9 flex flex-col gap-2.5 mt-1">
          {repliesLoading ? (
            <Skeleton className="h-8 w-full rounded-xl" />
          ) : (
            replies?.map((r) => <CommentItem key={r.id} comment={r} post={post} isReply onReply={onReply} />)
          )}
        </div>
      )}
    </div>
  )
}

function CommentsSection({ post }: { post: Post }) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null)
  const { data: replyAuthor } = useUser(replyingTo?.authorId)

  const { data: comments, isLoading } = useQuery({
    queryKey: ['feed', post.id, 'comments'],
    queryFn: () => feedService.listComments(post.id),
  })

  const addMutation = useMutation({
    mutationFn: () => feedService.addComment(post.id, text.trim(), replyingTo?.id),
    onSuccess: () => {
      setText('')
      setReplyingTo(null)
      queryClient.invalidateQueries({ queryKey: ['feed', post.id, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post comment'),
  })

  function submit() {
    if (!text.trim() || addMutation.isPending) return
    addMutation.mutate()
  }

  return (
    <div className="border-t border-border/70 px-4 sm:px-5 py-3.5 bg-surface-sunken/20 flex flex-col gap-3">
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : comments && comments.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto no-scrollbar">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} post={post} onReply={setReplyingTo} />
          ))}
        </div>
      ) : !post.commentsDisabled ? (
        <p className="text-xs text-fg-muted py-1">No comments yet. Be the first to start the conversation.</p>
      ) : null}

      {post.commentsDisabled ? (
        <p className="text-xs text-fg-muted text-center py-1 font-medium">Comments are turned off for this post.</p>
      ) : (
        <>
          {replyingTo && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-sunken px-3 py-1.5 text-xs">
              <span className="text-fg-muted truncate">
                Replying to <span className="font-bold text-fg">{replyAuthor?.name ?? '…'}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-fg-muted hover:text-fg cursor-pointer shrink-0"
                aria-label="Cancel reply"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5 pt-1">
            <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="xs" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={replyingTo ? `Reply to ${replyAuthor?.name ?? 'comment'}…` : 'Write a comment…'}
              className="flex-1 rounded-full border border-border/80 bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || addMutation.isPending}
              className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-30 cursor-pointer transition-all active:scale-95 shadow-xs"
              aria-label="Post comment"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function PostCard({ post }: { post: Post }) {
  const { data: author } = useUser(post.authorId)
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [likesOpen, setLikesOpen] = useState(false)

  // Optimistic like: the toggle should feel instant, not wait on a POST + a full feed refetch.
  // Flip it locally the moment the click happens, then reconcile with whatever the server
  // actually returns — rolling back only if the request itself fails.
  const likeMutation = useMutation({
    mutationFn: () => feedService.toggleLike(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['savedPosts'], exact: false })

      const wasLiked = post.isLiked
      const flip = (p: Post): Post =>
        p.id === post.id ? { ...p, isLiked: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) } : p

      const prevFeed = queryClient.getQueryData<Post[]>(['feed'])
      if (prevFeed) queryClient.setQueryData<Post[]>(['feed'], prevFeed.map(flip))

      const prevDetail = queryClient.getQueryData<Post>(['feed', post.id, 'detail'])
      if (prevDetail) queryClient.setQueryData<Post>(['feed', post.id, 'detail'], flip(prevDetail))

      const prevSaved = queryClient.getQueriesData<Page<Post>>({ queryKey: ['savedPosts'], exact: false })
      prevSaved.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, { ...data, content: data.content.map(flip) })
      })

      return { prevFeed, prevDetail, prevSaved }
    },
    onSuccess: (updated) => {
      const reconcile = (p: Post) => (p.id === updated.id ? updated : p)
      queryClient.setQueryData<Post[]>(['feed'], (prev) => prev?.map(reconcile))
      queryClient.setQueryData<Post>(['feed', updated.id, 'detail'], (prev) => (prev ? updated : prev))
      queryClient.setQueriesData<Page<Post>>({ queryKey: ['savedPosts'], exact: false }, (prev) =>
        prev ? { ...prev, content: prev.content.map(reconcile) } : prev,
      )
    },
    onError: (err, _vars, context) => {
      if (context?.prevFeed) queryClient.setQueryData(['feed'], context.prevFeed)
      if (context?.prevDetail) queryClient.setQueryData(['feed', post.id, 'detail'], context.prevDetail)
      context?.prevSaved?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(err instanceof Error ? err.message : 'Could not update like')
    },
  })
  const saveMutation = useMutation({
    mutationFn: () => feedService.toggleSave(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] })
      toast.success(post.isSaved ? 'Removed from saved posts' : 'Post saved')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => feedService.deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Post deleted')
      setShowDeleteModal(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete post'),
  })
  const updateMutation = useMutation({
    mutationFn: (content: string) => feedService.updatePost(post.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Post updated')
      setShowEditModal(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update post'),
  })
  const hideLikeCountMutation = useMutation({
    mutationFn: () => feedService.toggleHideLikeCount(post.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success(updated.hideLikeCount ? 'Like count hidden from others' : 'Like count is now visible to others')
    },
  })
  const commentsDisabledMutation = useMutation({
    mutationFn: () => feedService.toggleCommentsDisabled(post.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success(updated.commentsDisabled ? 'Commenting turned off' : 'Commenting turned on')
    },
  })

  const isOwnPost = currentUser?.id === post.authorId
  const showLikeCount = post.likesCount > 0 && (!post.hideLikeCount || isOwnPost)

  const meta = typeMeta[post.type]
  const isLong = post.content.length > CONTENT_CLAMP_CHARS
  const shownContent = !isLong || expanded ? post.content : post.content.slice(0, CONTENT_CLAMP_CHARS).trimEnd() + '…'

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-xs rounded-xl bg-surface">
      <div className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
        {author ? (
          <Avatar src={author.avatarUrl} name={author.name} size="md" />
        ) : (
          <Skeleton className="size-10 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          {author ? (
            <>
              <Link to={`/people/${author.id}`} className="text-sm font-bold text-fg hover:underline">
                {author.name}
              </Link>
              {author.headline && <p className="text-xs text-fg-muted truncate">{author.headline}</p>}
            </>
          ) : (
            <Skeleton className="h-4 w-28" />
          )}
          <p className="text-[11px] font-medium text-fg-muted mt-0.5">{formatRelativeTime(post.createdAt)}</p>
        </div>
        <DropdownMenu
          trigger={
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-xl text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
              aria-label="Post options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          {isOwnPost ? (
            <>
              <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => setShowDeleteModal(true)}>
                Delete post
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<Pencil className="size-4" />}
                onClick={() => {
                  setEditContent(post.content)
                  setShowEditModal(true)
                }}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                icon={post.hideLikeCount ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                onClick={() => hideLikeCountMutation.mutate()}
              >
                {post.hideLikeCount ? 'Show like count to others' : 'Hide like count to others'}
              </DropdownItem>
              <DropdownItem
                icon={post.commentsDisabled ? <MessageCircle className="size-4" /> : <MessageCircleOff className="size-4" />}
                onClick={() => commentsDisabledMutation.mutate()}
              >
                {post.commentsDisabled ? 'Turn on commenting' : 'Turn off commenting'}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={<ExternalLink className="size-4" />} onClick={() => navigate(`/feed/${post.id}`)}>
                Go to post
              </DropdownItem>
            </>
          ) : (
            <>
              <DropdownItem icon={<ExternalLink className="size-4" />} onClick={() => navigate(`/feed/${post.id}`)}>
                Go to post
              </DropdownItem>
              <DropdownItem icon={<Info className="size-4" />} onClick={() => navigate(`/people/${post.authorId}`)}>
                About this account
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="px-4 sm:px-5 pb-3.5 flex flex-col gap-3">
        {post.content && (
          <div className="text-sm text-fg whitespace-pre-line leading-relaxed">
            {shownContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-1.5 text-xs font-bold text-fg hover:underline cursor-pointer"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {post.attachments.length > 0 && (
          <AttachmentCarousel
            attachments={post.attachments}
            isLiked={post.isLiked}
            onDoubleTapLike={() => likeMutation.mutate()}
          />
        )}

        {meta && post.relatedId && (
          <Link
            to={meta.to!(post.relatedId)}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-fg bg-surface-sunken border border-border/80 rounded-xl px-3.5 py-2.5 hover:bg-surface-hover transition-colors shadow-2xs w-fit"
          >
            <meta.icon className="size-4 text-fg-muted shrink-0" />
            <span>{meta.label}</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 px-4 sm:px-5 py-3 border-t border-border/70 bg-surface">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={cn(
              'flex items-center text-sm cursor-pointer transition-all duration-150 active:scale-90 font-medium disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
              post.isLiked ? 'text-rose-500' : 'text-fg-secondary hover:text-fg',
            )}
            aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
          >
            <Heart className={cn('size-5 transition-transform', post.isLiked && 'fill-current scale-110')} />
          </button>
          {showLikeCount && (
            <button
              type="button"
              onClick={() => setLikesOpen(true)}
              className="text-xs sm:text-sm font-semibold text-fg-secondary hover:text-fg hover:underline cursor-pointer transition-colors"
            >
              {post.likesCount}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 text-sm cursor-pointer transition-colors font-medium',
            commentsOpen ? 'text-fg font-bold' : 'text-fg-secondary hover:text-fg',
          )}
          aria-label="Comments"
        >
          <MessageCircle className="size-5" />
          {post.commentsCount > 0 && <span className="text-xs sm:text-sm font-semibold">{post.commentsCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex items-center text-fg-secondary hover:text-fg cursor-pointer transition-colors"
          aria-label="Share post"
        >
          <Send className="size-4.5" />
        </button>

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={cn(
            'flex items-center cursor-pointer transition-all duration-150 active:scale-90 ml-auto disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
            post.isSaved ? 'text-amber-500' : 'text-fg-secondary hover:text-amber-500',
          )}
          aria-label={post.isSaved ? 'Remove from saved' : 'Save post'}
        >
          <Bookmark className={cn('size-5 transition-transform', post.isSaved && 'fill-current scale-110')} />
        </button>
      </div>

      {commentsOpen && <CommentsSection post={post} />}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />

      <LikesModal postId={post.id} open={likesOpen} onClose={() => setLikesOpen(false)} />

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <div className="flex flex-col items-center text-center gap-2 pb-4">
          <div className="size-12 rounded-2xl bg-danger-100 text-danger-500 flex items-center justify-center mb-1 border border-danger-200">
            <Trash2 className="size-6" />
          </div>
          <p className="text-lg font-bold text-fg">Delete this post?</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            This action cannot be undone. The post, attachments, likes, and comments will be permanently removed.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/70">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete post
          </Button>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit post">
        <div className="flex flex-col gap-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            placeholder="Edit your post content…"
          />
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              isLoading={updateMutation.isPending}
              disabled={!editContent.trim() && post.attachments.length === 0}
              onClick={() => updateMutation.mutate(editContent)}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

