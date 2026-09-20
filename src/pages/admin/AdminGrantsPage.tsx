import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark, ExternalLink } from 'lucide-react'
import { listAdminGrants, reviewGrantModeration, setGrantRemoved } from '@/services/admin.service'
import type { ModerationStatus } from '@/types/admin'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { AdminRemoveContentModal } from '@/components/domain/AdminRemoveContentModal'
import { AdminReviewContentModal } from '@/components/domain/AdminReviewContentModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

function moderationBadge(status: ModerationStatus) {
  if (status === 'PENDING') return <Badge tone="warning" className="ml-2">Pending review</Badge>
  if (status === 'REJECTED') return <Badge tone="danger" className="ml-2">Rejected</Badge>
  return null
}

export default function AdminGrantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [includeRemoved, setIncludeRemoved] = useState(searchParams.get('includeRemoved') === 'true')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [target, setTarget] = useState<{ id: string; label: string; removed: boolean } | null>(null)
  const [reviewing, setReviewing] = useState<{ id: string; label: string; approving: boolean } | null>(null)
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
    queryKey: ['admin', 'grants', filters],
    queryFn: () => listAdminGrants(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'grants'] })

  const removeMutation = useMutation({
    mutationFn: (reason: string) => setGrantRemoved(target!.id, !target!.removed, reason || undefined),
    onSuccess: () => {
      invalidate()
      toast.success(target?.removed ? 'Grant restored' : 'Grant removed')
      setTarget(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this grant'),
  })

  const reviewMutation = useMutation({
    mutationFn: (reason: string) => reviewGrantModeration(reviewing!.id, reviewing!.approving, reason || undefined),
    onSuccess: () => {
      invalidate()
      toast.success(reviewing?.approving ? 'Grant approved — now visible to the community' : 'Grant rejected')
      setReviewing(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not review this grant'),
  })

  return (
    <div>
      <SearchFilterBar query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search grants by name or provider…" />
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer select-none">
          <input
            type="checkbox"
            id="admin-grants-include-removed"
            name="admin-grants-include-removed"
            checked={includeRemoved}
            onChange={(e) => { setIncludeRemoved(e.target.checked); setPage(0) }}
            className="size-3.5 rounded-md border-border accent-brand-600"
          />
          Show removed grants too
        </label>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="w-52">
          <option value="">All review statuses</option>
          <option value="PENDING">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load grants" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Landmark className="size-5" />} title="No grants match" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Application link</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((grant) => (
                    <tr key={grant.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-fg truncate max-w-sm">
                        {grant.name}
                        {grant.removedByAdmin && <Badge tone="danger" className="ml-2">Removed</Badge>}
                        {moderationBadge(grant.moderationStatus)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{grant.provider}</td>
                      <td className="px-4 py-3">
                        <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate max-w-xs">
                          {grant.applicationUrl} <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(grant.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/grants/${grant.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                            View <ExternalLink className="size-3" />
                          </Link>
                          {grant.moderationStatus === 'PENDING' && (
                            <>
                              <Button size="sm" onClick={() => setReviewing({ id: grant.id, label: grant.name, approving: true })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger-subtle" onClick={() => setReviewing({ id: grant.id, label: grant.name, approving: false })}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant={grant.removedByAdmin ? 'secondary' : 'danger-subtle'}
                            onClick={() => setTarget({ id: grant.id, label: grant.name, removed: grant.removedByAdmin })}
                          >
                            {grant.removedByAdmin ? 'Restore' : 'Remove'}
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

      {reviewing && (
        <AdminReviewContentModal
          open
          onClose={() => setReviewing(null)}
          itemLabel={reviewing.label}
          approving={reviewing.approving}
          isPending={reviewMutation.isPending}
          onConfirm={(reason) => reviewMutation.mutate(reason)}
        />
      )}
    </div>
  )
}
