import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  MessageCircleOff,
  ChevronLeft,
  ChevronRight,
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
  RotateCw,
  Flag,
  Users,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Post, PostAttachment, PostComment } from '@/types'
import type { Page } from '@/lib/api-client'
// Same asset the app's own brand mark uses (see Logo.tsx) — reused here as the public author avatar
// for an admin-published, unattributed post, imported (not from /public) for a content-hashed URL.
import buildAddaLogoUrl from '@/assets/logo.png'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/DropdownMenu'
import { ShareModal } from '@/components/domain/ShareModal'
import { LikesModal } from '@/components/domain/LikesModal'
import { ReportModal } from '@/components/domain/ReportModal'
import { PostLinkCard } from '@/components/domain/PostLinkCard'
import { HashtagText } from '@/components/domain/HashtagText'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatRelativeTime, cn } from '@/lib/utils'
import { typeMeta } from '@/lib/postTypeMeta'
import { documentLabel } from '@/lib/attachments'
import { DocumentIcon } from '@/components/domain/DocumentIcon'
import { toast } from '@/store/toast.store'
import * as feedService from '@/services/feed.service'

const CONTENT_CLAMP_CHARS = 280

/**
 * Applies `mapPost` to every post in a feed-shaped cache entry, regardless of which shape that
 * entry happens to be: a plain flat array (Home's teaser, tag/type-filtered Feed browsing) or a
 * `useInfiniteQuery` `{pages}` entry (the personalized feed's infinite scroll). Without this, a
 * cache patch keyed on the bare `['feed']` prefix silently no-ops against the `{pages}` shape —
 * `Array.isArray` is false for it — so a like/hide would stop updating instantly the moment a
 * personalized-feed page is open. `mapPost` returning `null` removes that post (used by hiding);
 * returning the post unchanged for anything that isn't the one being acted on is the caller's job,
 * same as the existing `flip`/`reconcile` helpers below already do.
 *
 * `moveToEndId`, when given, moves that post to the end of a FLAT-ARRAY entry only — Home's
 * one-shot teaser can reshuffle in place like this; the personalized feed's `{pages}` entry never
 * does (moving a post across `useInfiniteQuery` page boundaries mid-scroll is a real source of
 * visual glitches), so it's silently ignored for that shape. The signal update (affinity bump)
 * that actually deprioritizes this post in future rankings happens server-side either way.
 */
function mapFeedCache(data: unknown, mapPost: (post: Post) => Post | null, moveToEndId?: string): unknown {
  if (Array.isArray(data)) {
    const mapped = (data as Post[]).flatMap((p) => {
      const m = mapPost(p)
      return m ? [m] : []
    })
    if (moveToEndId) {
      const idx = mapped.findIndex((p) => p.id === moveToEndId)
      if (idx >= 0 && idx < mapped.length - 1) mapped.push(...mapped.splice(idx, 1))
    }
    return mapped
  }
  if (data && typeof data === 'object' && Array.isArray((data as { pages?: unknown }).pages)) {
    const paged = data as { pages: { content: Post[]; hasMore: boolean }[] }
    return {
      ...paged,
      pages: paged.pages.map((page) => ({
        ...page,
        content: page.content.flatMap((p) => {
          const mapped = mapPost(p)
          return mapped ? [mapped] : []
        }),
      })),
    }
  }
  return data
}

/** A tap on a feed video opens this instead of the browser's native fullscreen — defaults to a
 *  portrait frame regardless of the source video's own aspect ratio (letterboxed via
 *  object-contain), with a toggle to switch to a landscape frame. No native controls anywhere
 *  (no fullscreen/overflow-menu/volume-slider clutter) — just tap-to-play and a mute button. */
function ExpandedVideoViewer({ open, onClose, url }: { open: boolean; onClose: () => void; url: string }) {
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical')
  const [muted, setMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }

  return createPortal(
    <div className="fixed inset-0 z-60 bg-black flex flex-col items-center justify-center animate-in">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 left-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white shadow-md backdrop-blur-xs hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="size-5" />
      </button>

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white shadow-md backdrop-blur-xs hover:bg-white/20 transition-colors cursor-pointer"
      >
        {muted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
      </button>

      <div
        className={cn(
          'relative mx-auto flex items-center justify-center cursor-pointer touch-manipulation',
          orientation === 'vertical' ? 'h-[80vh] max-h-[80vh] aspect-[9/16]' : 'w-[92vw] max-w-4xl aspect-video',
        )}
        onClick={togglePlay}
      >
        <video ref={videoRef} src={url} muted={muted} playsInline autoPlay className="size-full object-contain" />
      </div>

      <button
        type="button"
        onClick={() => setOrientation((o) => (o === 'vertical' ? 'horizontal' : 'vertical'))}
        aria-label={orientation === 'vertical' ? 'Rotate to horizontal view' : 'Rotate to vertical view'}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white shadow-md backdrop-blur-xs hover:bg-white/20 transition-colors cursor-pointer"
      >
        <RotateCw
          className={cn('size-5 transition-transform duration-300', orientation === 'horizontal' && 'rotate-90')}
        />
      </button>
    </div>,
    document.body,
  )
}

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
  const [expandedOpen, setExpandedOpen] = useState(false)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const media = attachments.filter((a) => a.kind === 'image' || a.kind === 'video')
  const docs = attachments.filter((a) => a.kind === 'pdf' || a.kind === 'file')
  const current = media[index]

  // Autoplay (muted, as browsers require) once at least half the video is actually on screen
  // while scrolling the feed, and pause again once it drops back below that.
  useEffect(() => {
    const el = videoRef.current
    if (!el || current?.kind !== 'video') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5 && !expandedOpen) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [current?.url, current?.kind, expandedOpen])

  // `dblclick` doesn't reliably synthesize from two quick taps on touch devices, so single vs.
  // double tap is disambiguated by hand: the first tap waits briefly to see if a second one
  // follows before acting, matching how every feed app treats tap-to-open vs. double-tap-to-like.
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
      if (current?.kind === 'video') {
        videoRef.current?.pause()
        setExpandedOpen(true)
      }
    }, 280)
  }

  return (
    <div className="flex flex-col gap-2.5">
      {media.length > 0 && (
        <div className="relative w-full aspect-[16/10] sm:aspect-video bg-surface-sunken rounded-xl overflow-hidden group shadow-2xs select-none">
          {current.kind === 'video' ? (
            <video ref={videoRef} src={current.url} muted={muted} playsInline className="size-full object-contain bg-black" />
          ) : (
            <img src={current.url} alt="" className="size-full object-cover" loading="lazy" />
          )}

          {/* Transparent tap-catcher, sitting in front of the media rather than handling taps on
              the media itself. touch-action: manipulation stops mobile browsers from treating the
              second tap as a double-tap-to-zoom gesture instead of letting our own handler see it. */}
          <div className="absolute inset-0 cursor-pointer touch-manipulation" onClick={handleMediaTap} />

          {current.kind === 'video' && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="absolute top-3 right-3 flex size-8.5 items-center justify-center rounded-full bg-neutral-900/75 text-white shadow-md backdrop-blur-xs hover:bg-neutral-900/90 transition-all cursor-pointer"
              aria-label={muted ? 'Unmute video' : 'Mute video'}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          )}

          <ExpandedVideoViewer open={expandedOpen && current.kind === 'video'} onClose={() => setExpandedOpen(false)} url={current.url} />

          {burstId > 0 && (
            <div key={burstId} className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="size-20 text-white fill-white drop-shadow-lg animate-heart-burst" />
            </div>
          )}

          {media.length > 1 && (
            <>
              <span className="absolute top-3 left-3 rounded-full bg-neutral-900/75 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 shadow-xs">
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
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 shrink-0 border border-accent-500/20">
              <DocumentIcon fileName={doc.fileName} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg truncate group-hover:text-brand-600 transition-colors">
                {doc.fileName ?? 'Document'}
              </p>
              <p className="text-xs text-fg-muted">
                {doc.kind === 'pdf' ? 'Click to view or download PDF' : `${documentLabel(doc.fileName)} · click to download`}
              </p>
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
      <div className="flex items-center gap-3 pl-9 text-xs font-bold text-fg-muted">
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
              // Scoped to this post: a comment box renders once per post in the feed, so a
              // hardcoded id would collide across cards (invalid duplicate-id HTML, and worse for
              // autofill/accessibility than having no id at all).
              id={`comment-input-${post.id}`}
              name={`comment-input-${post.id}`}
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

/** Like / comment / share / save all share one box: same height, same icon size, same spacing between them. */
const ACTION_BUTTON =
  'flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer'

export function PostCard({ post }: { post: Post }) {
  // A platform post's authorId is a confidential admin account (getUser 404s it for anyone else),
  // so there's nothing to fetch for it — and nothing to wait on before showing "BuildAdda" below.
  const { data: author } = useUser(post.postedAsPlatform ? undefined : post.authorId)
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
  const [reportOpen, setReportOpen] = useState(false)

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

      // Every feed listing — Home (['feed','personalized','home',size]), the Feed page per filter/
      // tag (['feed', kindFilter, tag]), a profile's own posts (['feed', {authorId}]), the
      // personalized feed's infinite-scroll pages (['feed','personalized',size]) — is cached under
      // its own compound key, never the bare ['feed'] this used to look for with an exact-match
      // getQueryData/setQueryData. That always missed, so the heart/count never visibly moved on
      // click even though the request itself succeeded — only a later refetch (e.g. a full page
      // reload) would show it. exact: false catches every one of them, the same way `prevSaved`
      // below already does for ['savedPosts']; mapFeedCache handles both the flat-array shape and
      // the personalized feed's {pages} shape in one pass.
      //
      // Home's teaser is the one exception: a fresh like (not an unlike) also moves the post to
      // the end of its flat array, matching the product spec's "liked post moves down the
      // immediate stack" — Feed's {pages} entries never reshuffle (see mapFeedCache's moveToEndId
      // doc). Two disjoint predicates, not one broad call plus a second pass, so Home's entry is
      // never flip()'d twice.
      const isHomeFeedKey = (key: readonly unknown[]) => key[0] === 'feed' && key[1] === 'personalized' && key[2] === 'home'
      const prevFeeds = queryClient.getQueriesData<unknown>({ queryKey: ['feed'], exact: false })
      queryClient.setQueriesData<unknown>(
        { queryKey: ['feed'], exact: false, predicate: (query) => !isHomeFeedKey(query.queryKey) },
        (data: unknown) => mapFeedCache(data, flip),
      )
      queryClient.setQueriesData<unknown>(
        { queryKey: ['feed'], exact: false, predicate: (query) => isHomeFeedKey(query.queryKey) },
        (data: unknown) => mapFeedCache(data, flip, !wasLiked ? post.id : undefined),
      )

      const prevDetail = queryClient.getQueryData<Post>(['feed', post.id, 'detail'])
      if (prevDetail) queryClient.setQueryData<Post>(['feed', post.id, 'detail'], flip(prevDetail))

      const prevSaved = queryClient.getQueriesData<Page<Post>>({ queryKey: ['savedPosts'], exact: false })
      prevSaved.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, { ...data, content: data.content.map(flip) })
      })

      return { prevFeeds, prevDetail, prevSaved }
    },
    onSuccess: (updated) => {
      const reconcile = (p: Post) => (p.id === updated.id ? updated : p)
      queryClient.setQueriesData<unknown>({ queryKey: ['feed'], exact: false }, (data: unknown) => mapFeedCache(data, reconcile))
      queryClient.setQueryData<Post>(['feed', updated.id, 'detail'], (prev) => (prev ? updated : prev))
      queryClient.setQueriesData<Page<Post>>({ queryKey: ['savedPosts'], exact: false }, (prev) =>
        prev ? { ...prev, content: prev.content.map(reconcile) } : prev,
      )
    },
    onError: (err, _vars, context) => {
      context?.prevFeeds?.forEach(([key, data]) => queryClient.setQueryData(key, data))
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
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })
  // Optimistic removal (not a flip): once hidden, this post shouldn't still be sitting in the
  // feed the viewer is looking at right now, not just excluded from the next fetch.
  const hideMutation = useMutation({
    mutationFn: () => feedService.toggleHidePost(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const prevFeeds = queryClient.getQueriesData<unknown>({ queryKey: ['feed'], exact: false })
      queryClient.setQueriesData<unknown>({ queryKey: ['feed'], exact: false }, (data: unknown) =>
        mapFeedCache(data, (p) => (p.id === post.id ? null : p)),
      )
      toast.info("Post hidden — you won't see this again in your feed")
      return { prevFeeds }
    },
    onError: (err, _vars, context) => {
      context?.prevFeeds?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(err instanceof Error ? err.message : 'Could not hide this post')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => feedService.deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      setShowDeleteModal(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete post'),
  })
  const updateMutation = useMutation({
    mutationFn: (content: string) => feedService.updatePost(post.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      setShowEditModal(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update post'),
  })
  const hideLikeCountMutation = useMutation({
    mutationFn: () => feedService.toggleHideLikeCount(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
  const commentsDisabledMutation = useMutation({
    mutationFn: () => feedService.toggleCommentsDisabled(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
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
        {post.postedAsPlatform ? (
          <Avatar src={buildAddaLogoUrl} name="BuildAdda" size="md" />
        ) : author ? (
          <Avatar src={author.avatarUrl} name={author.name} size="md" />
        ) : (
          <Skeleton className="size-10 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          {post.postedAsPlatform ? (
            <span className="text-sm font-bold text-fg">BuildAdda</span>
          ) : author ? (
            <>
              <Link to={`/people/${author.id}`} className="text-sm font-bold text-fg hover:underline">
                {author.name}
              </Link>
              {author.headline && <p className="text-xs text-fg-muted truncate">{author.headline}</p>}
            </>
          ) : (
            <Skeleton className="h-4 w-28" />
          )}
          <p className="text-xs font-medium text-fg-muted mt-0.5 flex items-center gap-2">
            {formatRelativeTime(post.createdAt)}
            {meta && !post.relatedId && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-1.5 py-0.5 text-xs font-semibold text-fg-secondary">
                <meta.icon className="size-3" />
                {meta.label}
              </span>
            )}
            {post.visibility === 'CONNECTIONS' && (
              <span
                title="Only the author and their connections can see this post"
                className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-1.5 py-0.5 text-xs font-semibold text-fg-secondary"
              >
                <Users className="size-3" />
                Connections
              </span>
            )}
          </p>
        </div>
        <DropdownMenu
          trigger={
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
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
              {!post.postedAsPlatform && (
                <DropdownItem icon={<Info className="size-4" />} onClick={() => navigate(`/people/${post.authorId}`)}>
                  About this account
                </DropdownItem>
              )}
              <DropdownItem icon={<EyeOff className="size-4" />} onClick={() => hideMutation.mutate()}>
                Hide this post
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem danger icon={<Flag className="size-4" />} onClick={() => setReportOpen(true)}>
                Report post
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="px-4 sm:px-5 pb-3.5 flex flex-col gap-3">
        {post.content && (
          <div className="text-sm text-fg whitespace-pre-line leading-relaxed">
            <HashtagText text={shownContent} />
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

        {post.linkUrl && <PostLinkCard url={post.linkUrl} />}

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

      <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border-t border-border/70 bg-surface">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={cn(
              ACTION_BUTTON,
              'active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
              post.isLiked ? 'text-rose-500 hover:text-rose-500' : '',
            )}
            aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
            aria-pressed={post.isLiked}
          >
            <Heart className={cn('size-5 transition-transform', post.isLiked && 'fill-current scale-110')} />
          </button>
          {showLikeCount && (
            <button
              type="button"
              onClick={() => setLikesOpen(true)}
              aria-label={`View who liked this post (${post.likesCount})`}
              className="-ml-1.5 h-9 min-w-6 rounded-lg px-1.5 text-sm font-semibold tabular-nums text-fg-secondary hover:text-fg hover:underline cursor-pointer transition-colors"
            >
              {post.likesCount}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          className={cn(ACTION_BUTTON, commentsOpen && 'text-fg font-bold')}
          aria-label="Comments"
          aria-expanded={commentsOpen}
        >
          <MessageCircle className="size-5" />
          {post.commentsCount > 0 && <span className="text-sm font-semibold tabular-nums">{post.commentsCount}</span>}
        </button>

        <button type="button" onClick={() => setShareOpen(true)} className={ACTION_BUTTON} aria-label="Share post">
          <Send className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={cn(
            ACTION_BUTTON,
            'ml-auto active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
            post.isSaved ? 'text-amber-500 hover:text-amber-500' : 'hover:text-amber-500',
          )}
          aria-label={post.isSaved ? 'Remove from saved' : 'Save post'}
          aria-pressed={post.isSaved}
        >
          <Bookmark className={cn('size-5 transition-transform', post.isSaved && 'fill-current scale-110')} />
        </button>
      </div>

      {commentsOpen && <CommentsSection post={post} />}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />

      <LikesModal postId={post.id} open={likesOpen} onClose={() => setLikesOpen(false)} />

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} reportedUserId={post.authorId} postId={post.id} />

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <div className="flex flex-col items-center text-center gap-2 pb-4">
          <div className="size-12 rounded-xl bg-danger-100 text-danger-500 flex items-center justify-center mb-1 border border-danger-200">
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

