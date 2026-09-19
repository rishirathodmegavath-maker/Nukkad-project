import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X, Undo2, MessageCircle } from 'lucide-react'
import { listIntroInbox, listIntroSent, acceptIntroRequest, rejectIntroRequest, withdrawIntroRequest } from '@/services/intro-requests.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { PageHeader } from '@/components/domain/PageHeader'
import { PillTabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { IntroRequest, IntroRequestStatus } from '@/types'

const statusTone: Record<IntroRequestStatus, BadgeTone> = {
  Pending: 'info',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
}

function RequestCard({
  request,
  isInbox,
  onAccept,
  onReject,
  onWithdraw,
  onMessage,
  acceptPending,
  rejectPending,
  withdrawPending,
  messagePending,
}: {
  request: IntroRequest
  isInbox: boolean
  onAccept: () => void
  onReject: () => void
  onWithdraw: () => void
  onMessage: () => void
  acceptPending: boolean
  rejectPending: boolean
  withdrawPending: boolean
  messagePending: boolean
}) {
  const person = isInbox ? request.requester : request.recipient
  const contextLabel = request.startupName ?? request.ideaTitle

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        {person ? (
          <Link to={`/people/${person.id}`} className="flex items-center gap-2.5 min-w-0 group">
            <Avatar src={person.avatarUrl} name={person.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-fg group-hover:underline transition-colors truncate">{person.name}</p>
              <p className="text-xs text-fg-muted truncate">{person.headline}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        <Badge tone={statusTone[request.status]}>{request.status}</Badge>
      </div>
      {contextLabel && (
        <p className="text-xs text-fg-muted">
          About: <span className="text-fg font-medium">{contextLabel}</span>
        </p>
      )}
      <p className="text-sm text-fg-muted">“{request.message}”</p>
      <p className="text-xs text-fg-muted">{formatRelativeTime(request.createdAt)}</p>

      {request.status === 'Pending' && isInbox && (
        <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
          <Button size="sm" variant="danger-subtle" leftIcon={<X className="size-3.5" />} isLoading={rejectPending} onClick={onReject}>
            Decline
          </Button>
          <Button size="sm" leftIcon={<Check className="size-3.5" />} isLoading={acceptPending} onClick={onAccept}>
            Accept
          </Button>
        </div>
      )}
      {request.status === 'Pending' && !isInbox && (
        <div className="pt-3 border-t border-border-subtle">
          <Button size="sm" variant="outline" leftIcon={<Undo2 className="size-3.5" />} isLoading={withdrawPending} onClick={onWithdraw}>
            Withdraw
          </Button>
        </div>
      )}
      {request.status === 'Accepted' && (
        <div className="pt-3 border-t border-border-subtle">
          <Button size="sm" leftIcon={<MessageCircle className="size-3.5" />} isLoading={messagePending} onClick={onMessage}>
            Message
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function IntroRequestsPage() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const inboxQuery = useQuery({ queryKey: ['intro-requests', 'inbox'], queryFn: listIntroInbox, enabled: tab === 'inbox' })
  const sentQuery = useQuery({ queryKey: ['intro-requests', 'sent'], queryFn: listIntroSent, enabled: tab === 'sent' })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['intro-requests'] })
  }

  // The backend opens the conversation atomically as part of accepting the request, so the
  // response already carries the conversationId -- no separate call needed to make that a real,
  // visible effect of acceptance rather than a silent permission change nobody notices.
  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptIntroRequest(id),
    onSuccess: (accepted) => {
      invalidate()
      toast.success('Introduction accepted')
      if (accepted.conversationId) navigate(`/messages/${accepted.conversationId}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not accept this request'),
  })
  const messageMutation = useMutation({
    mutationFn: (otherUserId: string) => getOrCreateConversationWith(otherUserId),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not open this conversation'),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectIntroRequest(id),
    onSuccess: () => {
      invalidate()
      toast.info('Introduction declined')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not decline this request'),
  })
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => withdrawIntroRequest(id),
    onSuccess: () => {
      invalidate()
      toast.info('Request withdrawn')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not withdraw this request'),
  })

  const data = tab === 'inbox' ? inboxQuery.data : sentQuery.data
  const isLoading = tab === 'inbox' ? inboxQuery.isLoading : sentQuery.isLoading

  return (
    <div>
      <PageHeader title="Introduction requests" description="Review requests you've sent and received." />
      <PillTabs
        items={[
          { key: 'inbox', label: 'Received' },
          { key: 'sent', label: 'Sent' },
        ]}
        value={tab}
        onChange={(k) => setTab(k as 'inbox' | 'sent')}
      />
      <div className="mt-6">
        {isLoading ? (
          <CardSkeletonGrid count={4} />
        ) : data && data.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.map((r) => {
              const otherUserId = tab === 'inbox' ? r.requesterId : r.recipientId
              return (
                <RequestCard
                  key={r.id}
                  request={r}
                  isInbox={tab === 'inbox'}
                  onAccept={() => acceptMutation.mutate(r.id)}
                  onReject={() => rejectMutation.mutate(r.id)}
                  onWithdraw={() => withdrawMutation.mutate(r.id)}
                  onMessage={() => messageMutation.mutate(otherUserId)}
                  acceptPending={acceptMutation.isPending && acceptMutation.variables === r.id}
                  rejectPending={rejectMutation.isPending && rejectMutation.variables === r.id}
                  withdrawPending={withdrawMutation.isPending && withdrawMutation.variables === r.id}
                  messagePending={messageMutation.isPending && messageMutation.variables === otherUserId}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState title={tab === 'inbox' ? 'No introduction requests yet' : "You haven't sent any requests yet"} />
        )}
      </div>
    </div>
  )
}
