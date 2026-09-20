import { MutationCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { toast } from '@/store/toast.store'

export const queryClient: QueryClient = new QueryClient({
  // Connect / accept / cancel is a toggle on the server. Each call says which status the screen was
  // showing, and the server refuses (409) rather than act on a connection that has since changed —
  // e.g. tapping a stale "Requested" after the other person already accepted. Handled once here so
  // every button behaves the same: nothing was changed, so say so and reload what the screen shows.
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && error.errorCode === 'CONNECTION_STATE_CHANGED') {
        toast.info('This connection just changed. Showing the latest.')
        for (const key of ['user', 'users', 'network', 'user-connections', 'notifications', 'currentUser']) {
          queryClient.invalidateQueries({ queryKey: [key] })
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
