import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserPlus, Clock, MessageSquare, MapPin, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { listUserConnections, toggleConnect } from '@/services/users.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { User } from '@/types'

interface UserConnectionsModalProps {
  userId: string
  userName: string
  open: boolean
  onClose: () => void
}

function ConnectionRow({
  user,
  onNavigate,
}: {
  user: User
  onNavigate: () => void
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const isSelf = currentUser?.id === user.id

  const connectMutation = useMutation({
    mutationFn: () => toggleConnect(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-connections'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(user.id),
    onSuccess: (conversation) => {
      onNavigate()
      navigate(`/messages/${conversation.id}`)
    },
  })

  return (
    <div className="flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-xl border border-border/70 hover:border-border-strong hover:bg-surface-hover/50 transition-all bg-surface min-w-0">
      <Link
        to={`/people/${user.id}`}
        onClick={onNavigate}
        className="flex items-center gap-3 min-w-0 flex-1 group"
      >
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-fg truncate">
              {user.name}
            </p>
            {isSelf && (
              <span className="text-[11px] font-medium text-fg-muted bg-surface-sunken px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted truncate">{user.headline || user.role || 'Community Member'}</p>
          {user.location && (
            <p className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
              <MapPin className="size-3 text-fg-muted/80 shrink-0" />
              <span className="truncate">{user.location}</span>
            </p>
          )}
        </div>
      </Link>

      {!isSelf && (
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {user.connectionStatus === 'CONNECTED' ? (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<MessageSquare className="size-3.5" />}
              isLoading={messageMutation.isPending}
              onClick={() => messageMutation.mutate()}
            >
              Message
            </Button>
          ) : user.connectionStatus === 'PENDING_OUTGOING' ? (
            <Button size="sm" variant="secondary" disabled leftIcon={<Clock className="size-3.5" />}>
              Requested
            </Button>
          ) : user.connectionStatus === 'PENDING_INCOMING' ? (
            <Button
              size="sm"
              isLoading={connectMutation.isPending}
              leftIcon={<UserCheck className="size-3.5" />}
              onClick={() => connectMutation.mutate()}
            >
              Accept
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              isLoading={connectMutation.isPending}
              leftIcon={<UserPlus className="size-3.5" />}
              onClick={() => connectMutation.mutate()}
            >
              Connect
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function UserConnectionsModal({
  userId,
  userName,
  open,
  onClose,
}: UserConnectionsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user-connections', userId],
    queryFn: () => listUserConnections(userId),
    enabled: open && !!userId,
  })

  const filteredConnections = useMemo(() => {
    if (!connections) return []
    if (!searchQuery.trim()) return connections
    const q = searchQuery.toLowerCase().trim()
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.headline && c.headline.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.collegeOrCompany && c.collegeOrCompany.toLowerCase().includes(q)) ||
        c.skills.some((s) => s.toLowerCase().includes(q)),
    )
  }, [connections, searchQuery])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${userName}’s Connections`}
      description={
        connections ? `${connections.length} total connection${connections.length === 1 ? '' : 's'}` : undefined
      }
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
          <input
            id="user-connections-search"
            name="user-connections-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections by name, skill, company…"
            className="w-full rounded-lg border border-border/80 bg-surface pl-10 pr-9 py-2 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
          {isLoading ? (
            <div className="flex flex-col gap-2.5 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            </div>
          ) : isError ? (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-fg-muted">Could not load connections.</p>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-fg-muted">
                {searchQuery ? `No connections matching "${searchQuery}"` : 'No connections yet.'}
              </p>
            </div>
          ) : (
            filteredConnections.map((connUser) => (
              <ConnectionRow key={connUser.id} user={connUser} onNavigate={onClose} />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
