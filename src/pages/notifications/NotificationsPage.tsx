import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus,
  Lightbulb,
  Briefcase,
  CalendarDays,
  MessageCircle,
  Bell,
  X,
  UserCheck,
  CheckCheck,
  Rocket,
  Award,
  Star,
  Building2,
  Landmark,
  Wallet,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useNotifications'
import { useUser } from '@/hooks/useUser'
import { toggleConnect, declineConnection } from '@/services/users.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MessageAction } from '@/components/domain/MessageAction'
import { Avatar } from '@/components/ui/Avatar'
import { PillTabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/domain/PageHeader'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { cn, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { NotificationType, NukkadNotification } from '@/types'

const typeIcon: Record<NotificationType, typeof Bell> = {
  connection: UserPlus,
  idea_interest: Lightbulb,
  opportunity: Briefcase,
  event: CalendarDays,
  reply: MessageCircle,
  endorsement: Award,
  recommendation: Star,
  startup: Rocket,
  chapter: Building2,
  investor: Landmark,
  wallet: Wallet,
  grant: Landmark,
  investor_activation: Landmark,
}

const typeColor: Record<NotificationType, string> = {
  connection: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40',
  idea_interest: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40',
  opportunity: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40',
  event: 'bg-surface-sunken text-fg-secondary border border-border/80',
  reply: 'bg-surface-sunken text-fg-secondary border border-border/80',
  endorsement: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40',
  recommendation: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40',
  startup: 'bg-surface-sunken text-fg-secondary border border-border/80',
  chapter: 'bg-surface-sunken text-fg-secondary border border-border/80',
  investor: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40',
  wallet: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40',
  grant: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40',
  investor_activation: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40',
}

// These titles are only ever sent to the opportunity's own poster (see OpportunityService),
// so routing them straight to the applications page is always an authorized destination.
const FOUNDER_FACING_OPPORTUNITY_TITLES = new Set([
  'New application',
  'Application withdrawn',
  'New interest in your opportunity',
])

const typeLink: Record<NotificationType, (relatedId?: string, title?: string) => string | undefined> = {
  connection: (id) => (id ? `/people/${id}` : undefined),
  idea_interest: (id) => (id ? `/ideas/${id}` : undefined),
  opportunity: (id, title) =>
    id
      ? title && FOUNDER_FACING_OPPORTUNITY_TITLES.has(title)
        ? `/opportunities/${id}/applications`
        : `/opportunities/${id}`
      : undefined,
  event: (id) => (id ? `/events/${id}` : undefined),
  reply: () => '/messages',
  endorsement: (id) => (id ? `/people/${id}` : undefined),
  recommendation: (id) => (id ? `/people/${id}` : undefined),
  startup: (id) => (id ? `/startups/${id}` : undefined),
  chapter: (id) => (id ? `/chapters/${id}` : undefined),
  investor: () => '/investors/requests',
  wallet: () => '/wallet',
  grant: (id) => (id ? `/grants/${id}` : undefined),
  investor_activation: (id) => (id ? `/investors/${id}` : '/investors/activate'),
}

const CONNECTION_REQUEST_TITLE = 'New connection request'

/**
 * A "wants to connect" notification is an event, but what the person can do about it depends on the
 * connection as it is now. A re-sent request leaves an older notification behind for the same
 * person; only the newest one stands for the request that actually exists, so keep just that one.
 */
function dropSupersededRequests(list: NukkadNotification[]): NukkadNotification[] {
  const seen = new Set<string>()
  return list.filter((n) => {
    // Chat messages are not notifications any more (they show as a brief toast, and as unread
    // conversations). Rows from before that change are hidden here too, whichever side is deployed first.
    if (n.type === 'reply') return false
    if (n.type !== 'connection' || n.title !== CONNECTION_REQUEST_TITLE || !n.actorUserId) return true
    if (seen.has(n.actorUserId)) return false
    seen.add(n.actorUserId)
    return true
  })
}

function NotificationRow({ notif }: { notif: NukkadNotification }) {
  const { data: actor } = useUser(notif.actorUserId)
  const markRead = useMarkNotificationRead()
  const queryClient = useQueryClient()
  const Icon = typeIcon[notif.type]
  const link = typeLink[notif.type](notif.relatedId, notif.title)

  // Show the request as it stands now, not as it was when it arrived.
  const isRequest = notif.type === 'connection' && notif.title === CONNECTION_REQUEST_TITLE
  const status = actor?.connectionStatus
  const isPendingRequest = isRequest && status === 'PENDING_INCOMING'
  const isNowConnected = isRequest && status === 'CONNECTED'
  const isNoLongerPending = isRequest && (status === 'NONE' || status === 'PENDING_OUTGOING')
  const title = isNowConnected ? "You're now connected" : notif.title
  const message = isNowConnected
    ? `You and ${actor?.name} are connected.`
    : isNoLongerPending
    ? `${actor?.name}'s connection request is no longer pending.`
    : notif.message

  const refreshConnectionViews = () => {
    for (const key of ['user', 'users', 'network', 'user-connections', 'notifications', 'currentUser']) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  const acceptMutation = useMutation({
    mutationFn: () => toggleConnect(notif.actorUserId!, 'PENDING_INCOMING'),
    onSuccess: (updated) => {
      refreshConnectionViews()
      toast.success(`You are now connected with ${updated.name}`)
    },
  })
  const declineMutation = useMutation({
    mutationFn: () => declineConnection(notif.actorUserId!),
    onSuccess: (updated) => {
      refreshConnectionViews()
      toast.info(`Declined ${updated.name}'s request`)
    },
  })

  const content = (
    <div
      className={cn(
        'flex items-start gap-3.5 p-4 sm:p-5 transition-colors relative group',
        !notif.isRead ? 'bg-brand-500/5' : 'bg-surface hover:bg-surface-hover/60',
      )}
      onClick={() => !notif.isRead && markRead.mutate(notif.id)}
    >
      <div className="relative shrink-0">
        {actor ? (
          <Avatar src={actor.avatarUrl} name={actor.name} size="md" />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface-sunken text-fg-muted">
            <Icon className="size-5" />
          </span>
        )}
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-surface shadow-2xs',
            typeColor[notif.type],
          )}
        >
          <Icon className="size-2.5" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notif.isRead ? 'font-bold text-fg' : 'font-semibold text-fg/90')}>
          {title}
        </p>
        <p className="text-sm text-fg-muted mt-1 leading-relaxed">{message}</p>
        <p className="text-xs font-medium text-fg-muted/80 mt-1.5">{formatRelativeTime(notif.createdAt)}</p>

        {isNowConnected && actor && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <MessageAction userId={actor.id} />
          </div>
        )}

        {isPendingRequest && (
          <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              leftIcon={<UserCheck className="size-3.5" />}
              isLoading={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<X className="size-3.5" />}
              isLoading={declineMutation.isPending}
              onClick={() => declineMutation.mutate()}
            >
              Decline
            </Button>
          </div>
        )}
      </div>

      {!notif.isRead && (
        <span
          className="size-2.5 rounded-full bg-brand-600 shrink-0 mt-1.5 shadow-2xs motion-safe:animate-pulse"
          aria-label="Unread"
        />
      )}
    </div>
  )

  return link ? (
    <Link to={link} className="block cursor-pointer">
      {content}
    </Link>
  ) : (
    <div className="cursor-pointer">{content}</div>
  )
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const { data: rawNotifications, isLoading, isError, refetch } = useNotifications()
  const notifications = useMemo(() => (rawNotifications ? dropSupersededRequests(rawNotifications) : undefined), [rawNotifications])
  const markAllRead = useMarkAllNotificationsRead()

  const tabs = useMemo(() => {
    if (!notifications) {
      return [
        { key: 'all', label: 'All' },
        { key: 'connections', label: 'Connections' },
        { key: 'opportunities', label: 'Opportunities' },
        { key: 'interactions', label: 'Activity' },
      ]
    }
    const connectionsCount = notifications.filter((n) => n.type === 'connection').length
    const oppsCount = notifications.filter((n) => n.type === 'opportunity').length
    const activityCount = notifications.filter((n) => n.type === 'reply' || n.type === 'idea_interest' || n.type === 'event').length

    return [
      { key: 'all', label: 'All', count: notifications.length },
      { key: 'connections', label: 'Connections', count: connectionsCount },
      { key: 'opportunities', label: 'Opportunities', count: oppsCount },
      { key: 'interactions', label: 'Activity', count: activityCount },
    ]
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    if (!notifications) return []
    if (filter === 'connections') return notifications.filter((n) => n.type === 'connection')
    if (filter === 'opportunities') return notifications.filter((n) => n.type === 'opportunity')
    if (filter === 'interactions')
      return notifications.filter((n) => n.type === 'reply' || n.type === 'idea_interest' || n.type === 'event')
    return notifications
  }, [notifications, filter])

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Stay updated on network activity.'}
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="size-4" />}
              onClick={() => markAllRead.mutate()}
              isLoading={markAllRead.isPending}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <PillTabs tone="soft" label="Filter notifications" items={tabs} value={filter} onChange={setFilter} />

      {isLoading ? (
        <CardSkeletonGrid count={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load notifications" onRetry={refetch} />
      ) : filteredNotifications && filteredNotifications.length > 0 ? (
        <Card padding="none" className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 shadow-xs bg-surface">
          {filteredNotifications.map((notif) => (
            <NotificationRow key={notif.id} notif={notif} />
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={<Bell className="size-6 text-fg-brand" />}
          title={
            filter === 'connections'
              ? 'No connection notifications'
              : filter === 'opportunities'
              ? 'No opportunity alerts'
              : filter === 'interactions'
              ? 'No recent activity'
              : "You're all caught up"
          }
          description="When members connect, respond to your ideas, or post matching opportunities, you will see them here."
        />
      )}
    </div>
  )
}

