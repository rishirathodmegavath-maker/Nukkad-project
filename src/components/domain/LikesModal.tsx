import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, UserCheck, UserPlus, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toggleConnect } from '@/services/users.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import * as feedService from '@/services/feed.service'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { PostLiker } from '@/types'

interface LikesModalProps {
  postId: string
  open: boolean
  onClose: () => void
}

function LikerRow({ liker, onNavigate }: { liker: PostLiker; onNavigate: () => void }) {
  const { data: user } = useUser(liker.userId)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const isSelf = currentUser?.id === liker.userId

  const connectMutation = useMutation({
    mutationFn: () => toggleConnect(liker.userId, user?.connectionStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-connections'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', liker.userId] })
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(liker.userId),
    onSuccess: (conversation) => {
      onNavigate()
      navigate(`/messages/${conversation.id}`)
    },
  })

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-xl border border-border/70 hover:border-border-strong hover:bg-surface-hover/50 transition-all bg-surface min-w-0">
      <Link to={`/people/${user.id}`} onClick={onNavigate} className="flex items-center gap-3 min-w-0 flex-1 group">
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-fg truncate">{user.name}</p>
            {isSelf && (
              <span className="text-[11px] font-medium text-fg-muted bg-surface-sunken px-1.5 py-0.5 rounded">You</span>
            )}
          </div>
          <p className="text-xs text-fg-muted truncate">{user.headline || user.role || 'Community Member'}</p>
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

export function LikesModal({ postId, open, onClose }: LikesModalProps) {
  const [page, setPage] = useState(0)
  const [likers, setLikers] = useState<PostLiker[]>([])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feed', postId, 'likes', page],
    queryFn: () => feedService.listLikers(postId, page),
    enabled: open,
  })

  useEffect(() => {
    if (!open) {
      setPage(0)
      setLikers([])
    }
  }, [open])

  useEffect(() => {
    if (!data) return
    setLikers((prev) => (page === 0 ? data.content : [...prev, ...data.content]))
  }, [data, page])

  const hasMore = data ? page + 1 < data.totalPages : false

  return (
    <Modal open={open} onClose={onClose} title="Liked by" size="md">
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
        {isLoading && page === 0 ? (
          <div className="flex flex-col gap-2.5 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-fg-muted">Could not load likes.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : likers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-fg-muted">No likes yet.</p>
          </div>
        ) : (
          <>
            {likers.map((liker) => (
              <LikerRow key={liker.userId} liker={liker} onNavigate={onClose} />
            ))}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                isLoading={isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="self-center mt-1"
              >
                Load more
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
