import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, UserPlus, UserCheck, Clock, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MatchReasons } from '@/components/domain/MatchReasons'
import { MessageAction } from '@/components/domain/MessageAction'
import * as usersService from '@/services/users.service'
import { toast } from '@/store/toast.store'

export function PersonCard({
  user,
  reasons,
  compatibilityScore,
  topRightAction,
}: {
  user: User
  reasons?: string[]
  compatibilityScore?: number
  topRightAction?: ReactNode
}) {
  const queryClient = useQueryClient()
  const connectMutation = useMutation({
    mutationFn: () => usersService.toggleConnect(user.id, user.connectionStatus),
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

  return (
    <Card interactive className="relative flex flex-col gap-3 border border-border/80 shadow-xs hover:border-border-strong transition-all min-w-0 overflow-hidden bg-surface">
      {topRightAction && (
        <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
          {topRightAction}
        </div>
      )}
      {/* skills/lookingFor/reasons used to sit outside this Link — interactive's cursor-pointer/hover
          made that area look clickable, but it wasn't. The action buttons below are real separate
          actions (they already stopPropagation), so they deliberately stay outside the link. */}
      <Link to={`/people/${user.id}`} className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-fg truncate text-sm sm:text-base">{user.name}</p>
            <p className="text-xs sm:text-sm text-fg-muted truncate">{user.headline || 'Community Member'}</p>
            <p className="text-xs text-fg-muted flex items-center gap-1 mt-1 font-medium">
              <MapPin className="size-3 text-fg-muted/80" /> {user.location || 'Location not specified'}
            </p>
          </div>
          {compatibilityScore !== undefined && (
            <Badge tone="accent" className="shrink-0 font-semibold shadow-2xs">
              {Math.round(compatibilityScore * 100)}% match
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {user.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>

        {(user.lookingFor.length > 0 || user.role) && (
          <p className="text-xs text-fg-muted">
            {user.lookingFor.length > 0 ? (
              <>
                <span className="font-medium text-fg-secondary">Looking for: </span>
                {user.lookingFor.slice(0, 2).join(' · ')}
              </>
            ) : (
              user.role
            )}
          </p>
        )}

        {reasons && reasons.length > 0 && <MatchReasons reasons={reasons} />}
      </Link>

      <div className="flex items-center justify-end mt-auto gap-2">
        {user.connectionStatus === 'PENDING_INCOMING' ? (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="secondary"
              isLoading={declineMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                declineMutation.mutate()
              }}
              aria-label="Decline connection request"
            >
              <X className="size-3.5" />
            </Button>
            <Button
              size="sm"
              isLoading={connectMutation.isPending}
              leftIcon={<UserCheck className="size-3.5" />}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                connectMutation.mutate()
              }}
            >
              Accept
            </Button>
          </div>
        ) : user.connectionStatus === 'CONNECTED' ? (
          // Already connected: the useful next step is a message. Removing the connection is done
          // from their profile, so one stray tap here can no longer disconnect two people.
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <MessageAction userId={user.id} />
          </div>
        ) : (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={user.connectionStatus === 'NONE' || !user.connectionStatus ? 'primary' : 'secondary'}
              isLoading={connectMutation.isPending}
              leftIcon={user.connectionStatus === 'PENDING_OUTGOING' ? <Clock className="size-3.5" /> : <UserPlus className="size-3.5" />}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                connectMutation.mutate()
              }}
            >
              {user.connectionStatus === 'PENDING_OUTGOING' ? 'Requested' : 'Connect'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
