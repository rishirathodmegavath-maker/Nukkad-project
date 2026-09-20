import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPost } from '@/services/feed.service'
import { PostCard } from '@/components/domain/PostCard'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface NavState {
  from?: string
  fromLabel?: string
  postIds?: string[]
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as NavState

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['feed', postId, 'detail'],
    queryFn: () => getPost(postId!),
    enabled: !!postId,
    retry: false,
  })

  const backTo = state.from ?? '/feed'
  const backLabel = state.fromLabel ?? (state.from ? 'Back to profile' : 'Back to feed')

  const postIds = state.postIds
  const currentIndex = postIds && postId ? postIds.indexOf(postId) : -1
  const prevId = currentIndex > 0 ? postIds![currentIndex - 1] : undefined
  const nextId = currentIndex >= 0 && currentIndex < (postIds?.length ?? 0) - 1 ? postIds![currentIndex + 1] : undefined

  function goTo(id: string) {
    navigate(`/feed/${id}`, { state, replace: true })
  }

  return (
    <div className="max-w-[620px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-semibold text-fg-secondary hover:text-fg px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-colors -ml-3"
        >
          <ArrowLeft className="size-4" />
          <span>{backLabel}</span>
        </Link>
        {(prevId || nextId) && (
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => prevId && goTo(prevId)}
              disabled={!prevId}
              aria-label="Previous post"
              className="flex size-8.5 items-center justify-center rounded-lg bg-surface border border-border/80 text-fg-secondary hover:bg-surface-hover hover:text-fg disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors shadow-2xs"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => nextId && goTo(nextId)}
              disabled={!nextId}
              aria-label="Next post"
              className="flex size-8.5 items-center justify-center rounded-lg bg-surface border border-border/80 text-fg-secondary hover:bg-surface-hover hover:text-fg disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors shadow-2xs"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        {prevId && (
          <button
            onClick={() => goTo(prevId)}
            aria-label="Previous post"
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -left-14 size-11 items-center justify-center rounded-full bg-surface border border-border/80 shadow-md hover:bg-surface-hover hover:scale-105 transition-all cursor-pointer text-fg"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {nextId && (
          <button
            onClick={() => goTo(nextId)}
            aria-label="Next post"
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-14 size-11 items-center justify-center rounded-full bg-surface border border-border/80 shadow-md hover:bg-surface-hover hover:scale-105 transition-all cursor-pointer text-fg"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {isLoading ? (
          <CardSkeletonGrid count={1} />
        ) : post ? (
          <PostCard post={post} />
        ) : (
          <EmptyState
            title={isError ? 'Post not found' : 'Loading…'}
            description="This post may have been removed or is no longer available."
            action={
              <button
                onClick={() => navigate('/feed')}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
              >
                Return to feed
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}

