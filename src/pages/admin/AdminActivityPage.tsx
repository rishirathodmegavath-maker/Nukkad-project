import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, Award, Banknote, Briefcase, CalendarDays, FileText, Flag, Landmark,
  Lightbulb, Lock, Newspaper, Rocket, UserPlus,
} from 'lucide-react'
import { listAdminActivity } from '@/services/admin.service'
import type { AdminActivity, AdminActivityType } from '@/types/admin'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'

interface TypeMeta {
  icon: ReactNode
  verb: string
  /** Where the admin can act on this kind of item. */
  to: (a: AdminActivity) => string | null
}

const icon = 'size-4'

const TYPE_META: Record<AdminActivityType, TypeMeta> = {
  USER_JOINED: { icon: <UserPlus className={icon} />, verb: 'joined BuildAdda', to: (a) => (a.targetId ? `/admin/users/${a.targetId}` : null) },
  STARTUP_CREATED: { icon: <Rocket className={icon} />, verb: 'A startup was registered', to: () => '/admin/startups' },
  IDEA_POSTED: { icon: <Lightbulb className={icon} />, verb: 'posted an idea', to: () => '/admin/ideas' },
  OPPORTUNITY_POSTED: { icon: <Briefcase className={icon} />, verb: 'posted an opportunity', to: () => '/admin/opportunities' },
  EVENT_CREATED: { icon: <CalendarDays className={icon} />, verb: 'created an event', to: () => null },
  GRANT_ADDED: { icon: <Award className={icon} />, verb: 'added a grant', to: () => '/admin/grants' },
  POST_PUBLISHED: { icon: <Newspaper className={icon} />, verb: 'published a post', to: () => '/admin/feed' },
  APPLICATION_SUBMITTED: { icon: <FileText className={icon} />, verb: 'applied to an opportunity', to: () => '/admin/opportunities' },
  REPORT_FILED: { icon: <Flag className={icon} />, verb: 'filed a report', to: () => '/admin/reports' },
  WITHDRAWAL_REQUESTED: { icon: <Banknote className={icon} />, verb: 'requested a withdrawal', to: () => '/admin/withdrawals' },
  INVESTOR_APPLICATION: { icon: <Landmark className={icon} />, verb: 'applied to become an investor', to: () => '/admin/investor-activations' },
}

function ActivityRow({ item }: { item: AdminActivity }) {
  const meta = TYPE_META[item.type]
  const link = meta.to(item)
  // USER_JOINED's label is the person's own name, which is already the actor.
  const showLabel = item.label && item.type !== 'USER_JOINED'

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg-secondary">
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">
          {item.actorName && <span className="font-semibold">{item.actorName} </span>}
          <span className={item.actorName ? 'text-fg-secondary' : 'font-medium'}>{meta.verb}</span>
          {showLabel && <span className="text-fg"> — {item.label}</span>}
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">{formatRelativeTime(item.occurredAt)}</p>
      </div>
      {link && (
        <Link to={link} className="shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          Open
        </Link>
      )}
    </li>
  )
}

export default function AdminActivityPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => listAdminActivity(100),
    refetchInterval: 30_000,
  })

  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-surface-sunken px-3.5 py-3 text-sm text-fg-muted mb-5">
        <Lock className="size-4 shrink-0 mt-0.5" />
        <span>
          Everything being created across BuildAdda, newest first. Private messages, connections and the text of
          applications are never shown here — they stay encrypted and out of the admin panel.
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load activity" onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState icon={<Activity className="size-5" />} title="No activity yet" description="New sign-ups, posts and listings will appear here." />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border/60">
            {data.map((item, i) => <ActivityRow key={`${item.type}-${item.targetId}-${i}`} item={item} />)}
          </ul>
        </Card>
      )}
    </div>
  )
}
