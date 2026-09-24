import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserCheck, Clock, X } from 'lucide-react'
import type { ConnectionStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { MessageAction } from '@/components/domain/MessageAction'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import * as usersService from '@/services/users.service'

interface ConnectActionProps {
  user: { id: string; name: string; connectionStatus?: ConnectionStatus }
  size?: 'sm' | 'md'
}

/**
 * Same connect/decline/unfriend toggle as PersonCard, factored out so opportunity
 * pages (founder card, applicant cards) can reuse the real connection system
 * instead of a third copy-pasted inline mutation. Keeps its own optimistic status
 * so it renders correctly regardless of which query cache the `user` prop came from.
 */
export function ConnectAction({ user, size = 'sm' }: ConnectActionProps) {
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState(user.connectionStatus)

  useEffect(() => setStatus(user.connectionStatus), [user.connectionStatus])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user', user.id] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const connectMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id, status),
    onSuccess: (updated) => {
      setStatus(updated.connectionStatus)
      invalidate()
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => usersService.declineConnection(user.id),
    onSuccess: (updated) => {
      setStatus(updated.connectionStatus)
      invalidate()
    },
  })

  if (!currentUser || currentUser.id === user.id) return null

  if (status === 'PENDING_INCOMING') {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size={size}
          variant="secondary"
          isLoading={declineMutation.isPending}
          onClick={() => declineMutation.mutate()}
          aria-label={`Decline connection request from ${user.name}`}
        >
          <X className="size-3.5" />
        </Button>
        <Button
          size={size}
          isLoading={connectMutation.isPending}
          leftIcon={<UserCheck className="size-3.5" />}
          onClick={() => connectMutation.mutate()}
        >
          Accept
        </Button>
      </div>
    )
  }

  // Already connected: offer a message. Removing the connection lives on their profile.
  if (status === 'CONNECTED') return <MessageAction userId={user.id} size={size} />

  return (
    <Button
      size={size}
      variant={status === 'NONE' || !status ? 'primary' : 'secondary'}
      isLoading={connectMutation.isPending}
      leftIcon={status === 'PENDING_OUTGOING' ? <Clock className="size-3.5" /> : <UserPlus className="size-3.5" />}
      onClick={() => connectMutation.mutate()}
    >
      {status === 'PENDING_OUTGOING' ? 'Requested' : 'Connect'}
    </Button>
  )
}
