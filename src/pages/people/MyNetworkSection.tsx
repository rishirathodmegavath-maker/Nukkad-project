import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Inbox, Send, Users } from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { NetworkPersonRow, NetworkRowSkeleton, type NetworkRowVariant } from '@/components/domain/NetworkPersonRow'
import { listIncomingConnectionRequests, listSentConnectionRequests, listUserConnections } from '@/services/users.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type NetworkTab = 'connections' | 'incoming' | 'sent'

const TAB_COPY: Record<NetworkTab, { variant: NetworkRowVariant; icon: ReactNode; emptyTitle: string; emptyDescription: string }> = {
  connections: {
    variant: 'connected',
    icon: <Users className="size-5" />,
    emptyTitle: 'Your network starts here.',
    emptyDescription: 'Connect with people from Discover to start building your network.',
  },
  incoming: {
    variant: 'incoming',
    icon: <Inbox className="size-5" />,
    emptyTitle: "You're all caught up.",
    emptyDescription: 'No new connection requests right now.',
  },
  sent: {
    variant: 'sent',
    icon: <Send className="size-5" />,
    emptyTitle: 'No pending requests.',
    emptyDescription: "Requests you send will appear here until they're accepted or cancelled.",
  },
}

export function MyNetworkSection() {
  const [tab, setTab] = useState<NetworkTab>('connections')
  const { data: currentUser } = useCurrentUser()
  const myId = currentUser?.id

  const connectionsQuery = useQuery({
    queryKey: ['network', 'connections', myId],
    queryFn: () => listUserConnections(myId!),
    enabled: !!myId,
  })
  const incomingQuery = useQuery({ queryKey: ['network', 'incoming'], queryFn: listIncomingConnectionRequests })
  const sentQuery = useQuery({ queryKey: ['network', 'sent'], queryFn: listSentConnectionRequests })

  const active = tab === 'connections' ? connectionsQuery : tab === 'incoming' ? incomingQuery : sentQuery
  const copy = TAB_COPY[tab]

  return (
    <div>
      <Tabs
        items={[
          { key: 'connections', label: 'Connections', count: connectionsQuery.data?.length },
          { key: 'incoming', label: 'Requests', count: incomingQuery.data?.length },
          { key: 'sent', label: 'Sent', count: sentQuery.data?.length },
        ]}
        value={tab}
        onChange={(key) => setTab(key as NetworkTab)}
        className="mb-4"
      />

      {active.isLoading ? (
        <div className="flex flex-col gap-2">
          <NetworkRowSkeleton />
          <NetworkRowSkeleton />
          <NetworkRowSkeleton />
        </div>
      ) : active.isError ? (
        <ErrorState description="Couldn't load this list." onRetry={() => active.refetch()} />
      ) : !active.data || active.data.length === 0 ? (
        <EmptyState icon={copy.icon} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <div className="flex flex-col gap-2">
          {active.data.map((user) => (
            <NetworkPersonRow key={user.id} user={user} variant={copy.variant} />
          ))}
        </div>
      )}
    </div>
  )
}
