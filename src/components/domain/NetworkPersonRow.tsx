import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, MessageSquare, UserCheck, UserMinus, UserX } from 'lucide-react'
import type { User } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import * as usersService from '@/services/users.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { toast } from '@/store/toast.store'

/** Row layout shared by every "My Network" list (Connections / Requests / Sent) — actions differ
 *  by relationship, but identity, invalidation and error handling stay identical across all three. */
export type NetworkRowVariant = 'connected' | 'incoming' | 'sent'

export function NetworkPersonRow({ user, variant }: { user: User; variant: NetworkRowVariant }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['network'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['user-connections'] })
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
  }

  const acceptMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id),
    onSuccess: () => {
      invalidateAll()
      toast.success(`You're now connected with ${user.name}`)
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => usersService.declineConnection(user.id),
    onSuccess: () => {
      invalidateAll()
      toast.info(`Declined ${user.name}'s request`)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id),
    onSuccess: () => {
      invalidateAll()
      toast.info(`Cancelled your request to ${user.name}`)
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id),
    onSuccess: () => {
      invalidateAll()
      toast.info(`Removed ${user.name} from your connections`)
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(user.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  })

  return (
    <div className="flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-xl border border-border/70 hover:border-border-strong hover:bg-surface-hover/50 transition-all bg-surface min-w-0">
      <Link to={`/people/${user.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-fg truncate">{user.name}</p>
          <p className="text-xs text-fg-muted truncate">{user.headline || user.role || 'Community Member'}</p>
          {user.location && (
            <p className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
              <MapPin className="size-3 text-fg-muted/80 shrink-0" />
              <span className="truncate">{user.location}</span>
            </p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {variant === 'connected' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<MessageSquare className="size-3.5" />}
              isLoading={messageMutation.isPending}
              onClick={() => messageMutation.mutate()}
            >
              Message
            </Button>
            <Button
              size="sm"
              variant="outline"
              isLoading={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
              aria-label={`Remove ${user.name} from your connections`}
            >
              <UserMinus className="size-3.5" />
            </Button>
          </>
        )}

        {variant === 'incoming' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              isLoading={declineMutation.isPending}
              onClick={() => declineMutation.mutate()}
            >
              Decline
            </Button>
            <Button
              size="sm"
              isLoading={acceptMutation.isPending}
              leftIcon={<UserCheck className="size-3.5" />}
              onClick={() => acceptMutation.mutate()}
            >
              Accept
            </Button>
          </>
        )}

        {variant === 'sent' && (
          <Button
            size="sm"
            variant="secondary"
            isLoading={cancelMutation.isPending}
            leftIcon={<UserX className="size-3.5" />}
            onClick={() => cancelMutation.mutate()}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export function NetworkRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 animate-pulse">
      <div className="size-10 rounded-full bg-surface-sunken shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3.5 w-32 rounded bg-surface-sunken" />
        <div className="h-3 w-48 rounded bg-surface-sunken" />
      </div>
    </div>
  )
}
