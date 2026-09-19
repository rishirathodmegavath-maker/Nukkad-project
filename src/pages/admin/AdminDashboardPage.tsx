import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Rocket, Lightbulb, Briefcase, Flag, ShieldAlert, UserCheck, Landmark, MapPin, ClipboardCheck, Banknote } from 'lucide-react'
import { getAdminDashboard } from '@/services/admin.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'

function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: number
  to?: string
}) {
  const content = (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-fg tabular-nums leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-fg-muted mt-1 truncate">{label}</p>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
  })

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState title="Couldn't load the dashboard" onRetry={refetch} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="size-5" />} label="Total users" value={data.totalUsers} to="/admin/users" />
        <StatCard icon={<UserCheck className="size-5" />} label="Active users" value={data.activeUsers} to="/admin/users?status=ACTIVE" />
        <StatCard icon={<ShieldAlert className="size-5" />} label="Suspended / disabled" value={data.suspendedUsers + data.disabledUsers} to="/admin/users?status=SUSPENDED" />
        <StatCard icon={<Landmark className="size-5" />} label="Investors" value={data.investors} />
        <StatCard icon={<Rocket className="size-5" />} label="Startups" value={data.totalStartups} to="/admin/startups" />
        <StatCard icon={<Lightbulb className="size-5" />} label="Ideas" value={data.totalIdeas} to="/admin/ideas" />
        <StatCard icon={<Briefcase className="size-5" />} label="Open opportunities" value={data.openOpportunities} to="/admin/opportunities" />
        <StatCard icon={<Flag className="size-5" />} label="Reports pending" value={data.pendingReports} to="/admin/reports?status=OPEN" />
        <StatCard icon={<ClipboardCheck className="size-5" />} label="Pending approvals" value={data.pendingModeration} to="/admin/startups?status=PENDING" />
        <StatCard icon={<Banknote className="size-5" />} label="Withdrawals pending" value={data.pendingWithdrawals} to="/admin/withdrawals?status=PENDING" />
        <StatCard icon={<Landmark className="size-5" />} label="Investor applications" value={data.pendingInvestorActivations} to="/admin/investor-activations?status=PENDING" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<MapPin className="size-5" />} label="Chapter presidents" value={data.chapterPresidents} />
        <StatCard icon={<Users className="size-5" />} label="Founders" value={data.founders} />
        <StatCard icon={<ShieldAlert className="size-5" />} label="Admins" value={data.admins} to="/admin/users?role=ADMIN" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-fg-secondary mb-3">Recent activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-fg-muted">No audit activity yet.</p>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {data.recentActivity.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone="neutral">{entry.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-secondary truncate">{entry.actorName ?? 'System'}</td>
                      <td className="px-4 py-3 text-fg-muted truncate">
                        {entry.entityType ? `${entry.entityType}${entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-right">{formatRelativeTime(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
