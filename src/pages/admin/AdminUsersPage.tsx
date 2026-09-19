import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { listAdminUsers } from '@/services/admin.service'
import type { AccountStatus } from '@/types/admin'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatRelativeTime } from '@/lib/utils'

const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'DISABLED', label: 'Disabled' },
]

const ROLE_FILTERS = [
  { key: 'all', label: 'All roles' },
  { key: 'ADMIN', label: 'Admin' },
  { key: 'FOUNDER', label: 'Founder' },
  { key: 'INVESTOR', label: 'Investor' },
  { key: 'CHAPTER_PRESIDENT', label: 'Chapter President' },
]

const statusTone = { ACTIVE: 'success', SUSPENDED: 'warning', DISABLED: 'danger' } as const

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [role, setRole] = useState(searchParams.get('role') ?? 'all')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (status !== 'all') next.set('status', status)
    if (role !== 'all') next.set('role', role)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [q, status, role, page, setSearchParams])

  const filters = useMemo(
    () => ({
      q: q || undefined,
      status: status === 'all' ? undefined : (status as AccountStatus),
      role: role === 'all' ? undefined : role,
      page,
      size: 20,
    }),
    [q, status, role, page],
  )

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => listAdminUsers(filters),
  })

  return (
    <div>
      <SearchFilterBar
        query={q}
        onQueryChange={(v) => {
          setQ(v)
          setPage(0)
        }}
        placeholder="Search by name, email or headline…"
      >
        <div className="flex flex-col gap-2.5">
          <PillTabs items={STATUS_FILTERS} value={status} onChange={(k) => { setStatus(k); setPage(0) }} />
          <PillTabs items={ROLE_FILTERS} value={role} onChange={(k) => { setRole(k); setPage(0) }} />
        </div>
      </SearchFilterBar>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load users" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No users match" description="Try a different search or filter." />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((user) => (
                    <tr key={user.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${user.id}`} className="flex flex-col min-w-0 hover:underline">
                          <span className="font-medium text-fg truncate">{user.name}</span>
                          <span className="text-xs text-fg-muted truncate">{user.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge key={r} tone={r === 'ADMIN' ? 'purple' : 'neutral'}>{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone[user.status]}>{user.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(user.createdAt)}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                        {user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
