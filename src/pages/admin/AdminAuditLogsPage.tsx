import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { listAuditLogs } from '@/services/admin.service'
import { Select, Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatRelativeTime } from '@/lib/utils'

const ACTIONS = [
  'LOGIN', 'LOGOUT', 'CREATE_IDEA', 'UPDATE_IDEA', 'DELETE_IDEA', 'CREATE_STARTUP',
  'CREATE_OPPORTUNITY', 'APPLY_OPPORTUNITY', 'INVESTOR_INTRODUCTION', 'ADMIN_ACTION',
  'ADMIN_USER_STATUS_CHANGED', 'ADMIN_USER_ROLE_CHANGED', 'ADMIN_REPORT_RESOLVED',
  'ADMIN_CONTENT_REMOVED', 'ADMIN_CONTENT_RESTORED', 'WALLET_ADMIN_ADJUSTMENT',
  'PAYMENT_INITIATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'ADMIN_STARTUP_CREATED',
]

export default function AdminAuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [action, setAction] = useState(searchParams.get('action') ?? '')
  const [entityType, setEntityType] = useState(searchParams.get('entityType') ?? '')
  const [actorId, setActorId] = useState(searchParams.get('actorId') ?? '')
  const [fromDate, setFromDate] = useState(searchParams.get('from') ?? '')
  const [toDate, setToDate] = useState(searchParams.get('to') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))

  useEffect(() => {
    const next = new URLSearchParams()
    if (action) next.set('action', action)
    if (entityType) next.set('entityType', entityType)
    if (actorId) next.set('actorId', actorId)
    if (fromDate) next.set('from', fromDate)
    if (toDate) next.set('to', toDate)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [action, entityType, actorId, fromDate, toDate, page, setSearchParams])

  const filters = useMemo(
    () => ({
      action: action || undefined,
      entityType: entityType || undefined,
      actorId: actorId.trim() || undefined,
      from: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
      to: toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined,
      page,
      size: 25,
    }),
    [action, entityType, actorId, fromDate, toDate, page],
  )

  const hasFilters = Boolean(action || entityType || actorId || fromDate || toDate)
  function clearFilters() {
    setAction('')
    setEntityType('')
    setActorId('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => listAuditLogs(filters),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <Select
          label="Action"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0) }}
          className="w-56"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select
          label="Entity type"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(0) }}
          className="w-48"
        >
          <option value="">All entities</option>
          <option value="User">User</option>
          <option value="Idea">Idea</option>
          <option value="Startup">Startup</option>
          <option value="Opportunity">Opportunity</option>
          <option value="Report">Report</option>
          <option value="IntroRequest">IntroRequest</option>
        </Select>
        <Input
          label="Actor user ID"
          value={actorId}
          onChange={(e) => { setActorId(e.target.value); setPage(0) }}
          placeholder="Filter by who did it"
          className="w-56"
        />
        <Input
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(0) }}
          className="w-40"
        />
        <Input
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(0) }}
          className="w-40"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load audit logs" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<History className="size-5" />} title="No matching audit entries" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3 text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap"><Badge tone="neutral">{entry.action}</Badge></td>
                      <td className="px-4 py-3 text-fg-secondary truncate">{entry.actorName ?? 'System'}</td>
                      <td className="px-4 py-3 text-fg-muted truncate">
                        {entry.entityType ? `${entry.entityType}${entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted truncate max-w-xs" title={entry.details ?? undefined}>
                        {entry.details ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-right">{formatRelativeTime(entry.createdAt)}</td>
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
