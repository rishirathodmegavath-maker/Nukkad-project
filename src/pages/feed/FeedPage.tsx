import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Video, Bookmark, Sparkles, Plus, FileText, Hash, X } from 'lucide-react'
import { listFeed, listSavedPosts } from '@/services/feed.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PostCard } from '@/components/domain/PostCard'
import { CreatePostModal } from '@/components/domain/CreatePostModal'
import { typeMeta, memberPostKinds } from '@/lib/postTypeMeta'
import { DocumentIcon } from '@/components/domain/DocumentIcon'
import { Avatar } from '@/components/ui/Avatar'
import { PillTabs, Tabs } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import type { Post, PostType, SavedPostsSort } from '@/types'

const FEED_TABS = [
  { key: 'all', label: 'Feed' },
  { key: 'saved', label: 'Saved' },
]

/** Blank-card guard: image → video frame → PDF tile → related-entity chip → text → generic fallback.
 *  A saved post must never render with none of these, which is what happened before for
 *  video-only/PDF-only posts and startup_update/idea/opportunity/event posts (those rely on the
 *  typeMeta chip instead of free-text content, exactly like the real PostCard already does). */
function SavedPostThumbnail({ post }: { post: Post }) {
  // A broken/expired image URL must fall through to the next tier rather than show a broken-image
  // icon or nothing at all — this is the "failed media URL" case the fallback chain has to cover.
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? undefined : post.attachments.find((a) => a.kind === 'image')
  const video = post.attachments.find((a) => a.kind === 'video')
  const doc = post.attachments.find((a) => a.kind === 'pdf' || a.kind === 'file')
  const meta = typeMeta[post.type]

  if (image) {
    return (
      <img
        src={image.url}
        alt=""
        onError={() => setImageFailed(true)}
        className="size-full object-cover transition-transform group-hover:scale-105"
      />
    )
  }
  if (video) {
    return (
      <div className="relative size-full bg-black">
        <video src={video.url} muted preload="metadata" className="size-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-xs text-white">
            <Video className="size-4" />
          </span>
        </span>
      </div>
    )
  }
  if (doc) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20 shrink-0">
          <DocumentIcon fileName={doc.fileName} className="size-4.5" />
        </span>
        <p className="text-xs font-semibold text-fg-secondary truncate max-w-full">{doc.fileName ?? 'Document'}</p>
      </div>
    )
  }
  if (meta) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
          <meta.icon className="size-4.5" />
        </span>
        <p className="text-xs font-semibold text-fg-secondary">{meta.label}</p>
      </div>
    )
  }
  if (post.content) {
    return (
      <div className="flex size-full items-center justify-center p-3 text-center bg-surface">
        <p className="text-xs text-fg-secondary line-clamp-5 leading-relaxed">{post.content}</p>
      </div>
    )
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
      <span className="flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
        <FileText className="size-4.5" />
      </span>
      <p className="text-xs font-semibold text-fg-secondary">View post</p>
    </div>
  )
}

function SavedPostsGrid({ posts }: { posts: Post[] }) {
  const postIds = posts.map((p) => p.id)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/feed/${post.id}`}
          state={{ from: '/feed?tab=saved', fromLabel: 'Back to saved posts', postIds }}
          className="group relative aspect-square overflow-hidden rounded-xl bg-surface-sunken border border-border/80 hover:border-brand-500 transition-all"
        >
          <SavedPostThumbnail post={post} />
          {post.attachments.length > 1 && (
            <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-2 py-0.5">
              +{post.attachments.length - 1}
            </span>
          )}
          <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-xs text-amber-400">
            <Bookmark className="size-3.5 fill-current" />
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs font-semibold text-white truncate">
              {post.content || typeMeta[post.type]?.label || 'View post'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

const SAVED_TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All types' },
  ...memberPostKinds.map((k) => ({ key: k.key, label: k.filterLabel })),
  // Older kinds that are no longer written from the Create a Post dialog but can still be saved.
  { key: 'startup_update', label: 'Startup updates' },
  { key: 'opportunity', label: 'Opportunities' },
]

/** Filter chips on the main feed: everything, or one kind of member post. */
const FEED_KIND_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  ...memberPostKinds.map((k) => ({ key: k.key, label: k.filterLabel })),
]

/** Dedicated saved-posts view: queries the user's saves directly (server-side paginated, sorted and
 *  filtered) instead of filtering a single page of /feed, so older saves are always reachable. */
function SavedPostsTab() {
  const [sort, setSort] = useState<SavedPostsSort>('newestSaved')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [posts, setPosts] = useState<Post[]>([])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['savedPosts', sort, typeFilter, page],
    queryFn: () => listSavedPosts({ sort, type: typeFilter === 'all' ? undefined : (typeFilter as PostType), page }),
  })

  // Sort/filter changes start a fresh accumulation at page 0 rather than mixing pages built under a
  // different sort/filter — same idea as LikesModal resetting its own accumulated list.
  useEffect(() => {
    setPage(0)
    setPosts([])
  }, [sort, typeFilter])

  useEffect(() => {
    if (!data) return
    setPosts((prev) => (page === 0 ? data.content : [...prev, ...data.content]))
  }, [data, page])

  const hasMore = data ? page + 1 < data.totalPages : false

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="w-full sm:w-56">
          <Select value={sort} onChange={(e) => setSort(e.target.value as SavedPostsSort)} aria-label="Sort saved posts">
            <option value="newestSaved">Newest saved</option>
            <option value="oldestSaved">Oldest saved</option>
            <option value="newestPost">Newest post</option>
            <option value="oldestPost">Oldest post</option>
          </Select>
        </div>
        <PillTabs tone="soft" label="Filter saved posts by type" items={SAVED_TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
      </div>

      {isLoading && page === 0 ? (
        <CardSkeletonGrid count={3} />
      ) : isError ? (
        <ErrorState title="Couldn't load saved posts" onRetry={() => refetch()} />
      ) : posts.length > 0 ? (
        <>
          <SavedPostsGrid posts={posts} />
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button variant="ghost" size="sm" isLoading={isLoading} onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title={typeFilter === 'all' ? 'No saved posts yet' : 'No saved posts match this filter'}
          description={
            typeFilter === 'all'
              ? 'Click the bookmark icon on any post in your feed to save it for later reference.'
              : 'Try a different type filter, or switch back to All types.'
          }
        />
      )}
    </div>
  )
}

/**
 * The feed. With `fixedKind` it is a page for one kind of post (Discussions): no Feed/Saved tabs and no kind filters,
 * and the composer starts on that kind. Either way `?tag=` narrows it to posts using a hashtag.
 */
export default function FeedPage({ fixedKind }: { fixedKind?: PostType } = {}) {
  const { data: currentUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = !fixedKind && searchParams.get('tab') === 'saved' ? 'saved' : 'all'
  const tag = (searchParams.get('tag') ?? '').replace(/^#/, '').trim().toLowerCase()
  const setTab = (next: string) => setSearchParams(next === 'saved' ? { tab: 'saved' } : {})
  const clearTag = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('tag')
    setSearchParams(next)
  }
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [pickedKind, setPickedKind] = useState('all')
  const kindFilter = fixedKind ?? pickedKind
  const fixedMeta = fixedKind ? memberPostKinds.find((k) => k.key === fixedKind) : undefined

  const { data: posts, isLoading, isError, refetch } = useQuery({
    queryKey: ['feed', kindFilter, tag],
    queryFn: () => listFeed(undefined, undefined, kindFilter === 'all' ? undefined : (kindFilter as PostType), tag || undefined),
    enabled: tab === 'all',
  })

  return (
    <div className="max-w-[620px] mx-auto flex flex-col gap-6">
      {fixedKind ? (
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Discussions</h1>
          <p className="mt-1 text-sm text-fg-muted">Start a conversation with builders across BuildAdda, or join one that is already going.</p>
        </header>
      ) : (
        <Tabs label="Feed view" items={FEED_TABS} value={tab} onChange={setTab} />
      )}

      {tab === 'all' && (
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="flex items-center gap-3 rounded-lg border border-border/80 bg-surface p-4 text-left shadow-xs transition-all duration-150 hover:border-border-strong active:scale-[0.995] cursor-pointer"
        >
          <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="md" />
          <span className="flex-1 min-w-0 truncate text-sm text-fg-muted">
            {fixedMeta ? 'Start a discussion…' : 'Share an update, ask for feedback, or celebrate an achievement…'}
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Plus className="size-4.5" />
          </span>
        </button>
      )}

      {tab === 'all' && !fixedKind && (
        <PillTabs tone="soft" scrollable label="Filter by post type" items={FEED_KIND_FILTERS} value={pickedKind} onChange={setPickedKind} />
      )}

      {tab === 'all' && tag && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-500/20 bg-brand-500/10 px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-sm text-fg">
            <Hash className="size-4 shrink-0 text-fg-brand" aria-hidden="true" />
            <span className="truncate">
              Posts tagged <span className="font-bold">#{tag}</span>
            </span>
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

      <CreatePostModal open={isComposerOpen} onClose={() => setIsComposerOpen(false)} initialType={fixedKind} />

      {tab === 'saved' ? (
        <SavedPostsTab />
      ) : isLoading ? (
        <CardSkeletonGrid count={3} />
      ) : isError ? (
        <EmptyState
          title="Could not load feed"
          description="Something went wrong while loading updates. Please try again."
          action={
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
            >
              Retry
            </button>
          }
        />
      ) : posts && posts.length > 0 ? (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : tag ? (
        <EmptyState
          icon={<Hash className="size-6" />}
          title={`No posts tagged #${tag} yet`}
          description="Add the tag to a post and it will show up here."
          action={
            <Button size="sm" variant="secondary" onClick={clearTag}>
              Show everything
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title={
            fixedMeta
              ? 'No discussions yet'
              : kindFilter === 'all'
                ? 'Your feed is waiting for your voice'
                : `No ${memberPostKinds.find((k) => k.key === kindFilter)?.emptyHint ?? 'posts'} yet`
          }
          description={
            fixedMeta
              ? 'Be the first to start one.'
              : kindFilter === 'all'
                ? 'Be the first to share an update, showcase a project, or ask a question to the community.'
                : 'Be the first — pick this type when you write a post.'
          }
        />
      )}
    </div>
  )
}
