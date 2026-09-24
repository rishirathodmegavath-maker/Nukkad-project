import { useInfiniteQuery } from '@tanstack/react-query'
import { listPersonalizedFeed } from '@/services/feed.service'

/**
 * The canonical personalized feed as an infinite-scroll list — the first `useInfiniteQuery` in
 * this codebase. `pageParam` is the full list of post ids already fetched across every page so
 * far (not an opaque cursor): the server excludes them directly from its candidate query, so a
 * dynamically-reranked feed never repeats or skips a post as scores shift between fetches.
 */
export function useInfinitePersonalizedFeed(size = 10, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['feed', 'personalized', size],
    queryFn: ({ pageParam }) => listPersonalizedFeed(size, pageParam),
    initialPageParam: [] as string[],
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.flatMap((page) => page.content.map((post) => post.id)) : undefined,
    enabled,
  })
}
