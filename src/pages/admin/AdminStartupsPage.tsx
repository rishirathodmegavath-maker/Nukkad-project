import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Rocket, ExternalLink, Plus } from 'lucide-react'
import { listAdminStartups, setStartupRemoved } from '@/services/admin.service'
import { memberAppUrl } from '@/lib/portal'
import type { ModerationStatus } from '@/types/admin'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { AdminRemoveContentModal } from '@/components/domain/AdminRemoveContentModal'
import { AdminStartupFormModal } from '@/components/domain/AdminStartupFormModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

// Startups are no longer reviewed before they go live; "Rejected" only remains on ones rejected earlier.
function moderationBadge(status: ModerationStatus) {
  if (status === 'REJECTED') return <Badge tone="danger" className="ml-2">Rejected</Badge>
  return null
}

export default function AdminStartupsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [includeRemoved, setIncludeRemoved] = useState(searchParams.get('includeRemoved') === 'true')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [target, setTarget] = useState<{ id: string; label: string; removed: boolean } | null>(null)
  const [adding, setAdding] = useState(false)
  const queryClient = useQueryClient()
  const filters = useMemo(
    () => ({ q: q || undefined, includeRemoved, status: (status || undefined) as ModerationStatus | undefined, page, size: 20 }),
    [q, includeRemoved, status, page],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (includeRemoved) next.set('includeRemoved', 'true')
    if (status) next.set('status', status)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [q, includeRemoved, status, page, setSearchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'startups', filters],
    queryFn: () => listAdminStartups(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'startups'] })

  const removeMutation = useMutation({
    mutationFn: (reason: string) => setStartupRemoved(target!.id, !target!.removed, reason || undefined),
    onSuccess: () => {
      invalidate()
      toast.success(target?.removed ? 'Startup restored' : 'Startup removed')
      setTarget(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this startup'),
  })

  return (
    <div>
      <SearchFilterBar query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search startups by name, sector, tagline…" />
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer select-none">
          <Checkbox
            id="admin-startups-include-removed"
            name="admin-startups-include-removed"
            checked={includeRemoved}
            onChange={(e) => { setIncludeRemoved(e.target.checked); setPage(0) }}
          />
          Show removed startups too
        </label>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="w-52">
          <option value="">All review statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
          Add startup
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load startups" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Rocket className="size-5" />} title="No startups match" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((startup) => (
                    <tr key={startup.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-fg truncate max-w-sm">
                        {startup.name}
                        {startup.isRaising && <Badge tone="accent" className="ml-2">Raising</Badge>}
                        {startup.removedByAdmin && <Badge tone="danger" className="ml-2">Removed</Badge>}
                        {moderationBadge(startup.moderationStatus)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{startup.sector ?? '—'}</td>
                      <td className="px-4 py-3"><Badge tone="neutral">{startup.stage}</Badge></td>
                      <td className="px-4 py-3 text-fg-muted">{startup.visibility}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(startup.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a href={memberAppUrl(`/startups/${startup.id}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-fg-brand hover:underline">
                            View <ExternalLink className="size-3" />
                          </a>
                          <Button
                            size="sm"
                            variant={startup.removedByAdmin ? 'secondary' : 'danger-subtle'}
                            onClick={() => setTarget({ id: startup.id, label: startup.name, removed: startup.removedByAdmin })}
                          >
                            {startup.removedByAdmin ? 'Restore' : 'Remove'}
                          </Button>
                        </div>
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

      {adding && <AdminStartupFormModal onClose={() => setAdding(false)} />}

      {target && (
        <AdminRemoveContentModal
          open
          onClose={() => setTarget(null)}
          itemLabel={target.label}
          targetRemoved={!target.removed}
          isPending={removeMutation.isPending}
          onConfirm={(reason) => removeMutation.mutate(reason)}
        />
      )}
    </div>
  )
}
