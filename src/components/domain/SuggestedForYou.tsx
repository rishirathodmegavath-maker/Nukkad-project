import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import * as usersService from '@/services/users.service'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

function SuggestionRow({ user }: { user: User }) {
  const queryClient = useQueryClient()

  const connectMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id, user.connectionStatus ?? 'NONE'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      const messages: Record<string, string> = {
        PENDING_OUTGOING: `Connection request sent to ${user.name}`,
        CONNECTED: `You're now connected with ${user.name}`,
        NONE: 'Removed connection',
      }
      toast.success(messages[updated.connectionStatus ?? 'NONE'])
    },
  })
  const declineMutation = useMutation({
    mutationFn: () => usersService.declineConnection(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.info(`Declined ${user.name}'s request`)
    },
  })

  const status = user.connectionStatus ?? 'NONE'

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Link to={`/people/${user.id}`} className="shrink-0">
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/people/${user.id}`} className="text-sm font-semibold text-fg hover:underline line-clamp-2 break-words block">
          {user.name}
        </Link>
        <p className="text-xs text-fg-muted truncate">{user.headline || 'Suggested for you'}</p>
      </div>

      {status === 'PENDING_INCOMING' ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => declineMutation.mutate()}
            disabled={declineMutation.isPending}
            className="text-xs font-semibold text-fg-muted hover:text-fg hover:bg-surface-hover px-2 py-1 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
            aria-label={`Decline ${user.name}'s connection request`}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
            aria-label={`Accept ${user.name}'s connection request`}
          >
            Accept
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending || status === 'CONNECTED'}
          className={cn(
            'text-xs font-semibold shrink-0 cursor-pointer disabled:cursor-default px-3 py-1.5 rounded-lg transition-colors',
            status === 'CONNECTED'
              ? 'text-fg-muted bg-surface-sunken'
              : status === 'PENDING_OUTGOING'
              ? 'text-fg-muted bg-surface-sunken'
              : 'text-fg-brand bg-brand-500/10 hover:bg-brand-500/20',
          )}
          aria-label={
            status === 'CONNECTED'
              ? `Connected with ${user.name}`
              : status === 'PENDING_OUTGOING'
              ? `Connection requested to ${user.name}`
              : `Connect with ${user.name}`
          }
        >
          {status === 'CONNECTED' ? 'Connected' : status === 'PENDING_OUTGOING' ? 'Requested' : 'Connect'}
        </button>
      )}
    </div>
  )
}

export function SuggestedForYou({ limit = 5, showHeader = true }: { limit?: number; showHeader?: boolean }) {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'suggested', limit],
    queryFn: () => usersService.listSuggestedConnections(limit),
  })

  return (
    <div className="flex flex-col gap-1">
      {showHeader && (
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-fg-muted">Suggested for you</h2>
          <Link to="/people" className="text-xs font-semibold text-fg hover:text-fg-muted">
            See all
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <div className="flex flex-col divide-y divide-border-subtle">
          {users.map((user) => (
            <SuggestionRow key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-fg-muted py-2">No suggestions right now.</p>
      )}
    </div>
  )
}
