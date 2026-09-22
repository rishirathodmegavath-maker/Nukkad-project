import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, ExternalLink, Plus } from 'lucide-react'
import { listAdminOpportunities, reviewOpportunityModeration, setOpportunityRemoved } from '@/services/admin.service'
import type { ModerationStatus } from '@/types/admin'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { AdminRemoveContentModal } from '@/components/domain/AdminRemoveContentModal'
import { AdminReviewContentModal } from '@/components/domain/AdminReviewContentModal'
import { AdminOpportunityFormModal } from '@/components/domain/AdminOpportunityFormModal'
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
  if (status === 'PENDING') return <Badge tone="warning" className="ml-1">Pending review</Badge>
  if (status === 'REJECTED') return <Badge tone="danger" className="ml-1">Rejected</Badge>
  return null
}

export default function AdminOpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [includeClosed, setIncludeClosed] = useState(searchParams.get('includeClosed') === 'true')
  const [includeRemoved, setIncludeRemoved] = useState(searchParams.get('includeRemoved') === 'true')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [target, setTarget] = useState<{ id: string; label: string; removed: boolean } | null>(null)
  const [reviewing, setReviewing] = useState<{ id: string; label: string; approving: boolean } | null>(null)
  const [adding, setAdding] = useState(false)
  const queryClient = useQueryClient()
  const filters = useMemo(
    () => ({ q: q || undefined, includeClosed, includeRemoved, status: (status || undefined) as ModerationStatus | undefined, page, size: 20 }),
    [q, includeClosed, includeRemoved, status, page],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (includeClosed) next.set('includeClosed', 'true')
    if (includeRemoved) next.set('includeRemoved', 'true')
    if (status) next.set('status', status)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [q, includeClosed, includeRemoved, status, page, setSearchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'opportunities', filters],
    queryFn: () => listAdminOpportunities(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] })

  const removeMutation = useMutation({
    mutationFn: (reason: string) => setOpportunityRemoved(target!.id, !target!.removed, reason || undefined),
    onSuccess: () => {
      invalidate()
      toast.success(target?.removed ? 'Opportunity restored' : 'Opportunity removed')
      setTarget(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this opportunity'),
  })

  const reviewMutation = useMutation({
    mutationFn: (reason: string) => reviewOpportunityModeration(reviewing!.id, reviewing!.approving, reason || undefined),
    onSuccess: () => {
      invalidate()
      toast.success(reviewing?.approving ? 'Opportunity approved — now visible to the community' : 'Opportunity rejected')
      setReviewing(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not review this opportunity'),
  })

  return (
    <div>
      <SearchFilterBar query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search opportunities by title, org…" />
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer select-none">
          <input
            type="checkbox"
            id="admin-opportunities-include-closed"
            name="admin-opportunities-include-closed"
            checked={includeClosed}
            onChange={(e) => { setIncludeClosed(e.target.checked); setPage(0) }}
            className="size-3.5 rounded-md border-border accent-brand-600"
          />
          Show closed postings too (matches public discovery by default, which excludes them)
        </label>
        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer select-none">
          <input
            type="checkbox"
            id="admin-opportunities-include-removed"
            name="admin-opportunities-include-removed"
            checked={includeRemoved}
            onChange={(e) => { setIncludeRemoved(e.target.checked); setPage(0) }}
            className="size-3.5 rounded-md border-border accent-brand-600"
          />
          Show removed postings too
        </label>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="w-52">
          <option value="">All review statuses</option>
          <option value="PENDING">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
          Add opportunity
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load opportunities" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Briefcase className="size-5" />} title="No opportunities match" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Applicants</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((opp) => (
                    <tr key={opp.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-fg truncate max-w-sm">
                        {opp.title} {opp.closed && <Badge tone="neutral" className="ml-1">Closed</Badge>}
                        {opp.removedByAdmin && <Badge tone="danger" className="ml-1">Removed</Badge>}
                        {moderationBadge(opp.moderationStatus)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{opp.organizationName}</td>
                      <td className="px-4 py-3"><Badge tone="neutral">{opp.type}</Badge></td>
                      <td className="px-4 py-3 text-fg-muted">{opp.applicantCount}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(opp.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/opportunities/${opp.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                            View <ExternalLink className="size-3" />
                          </Link>
                          {opp.moderationStatus === 'PENDING' && (
                            <>
                              <Button size="sm" onClick={() => setReviewing({ id: opp.id, label: opp.title, approving: true })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger-subtle" onClick={() => setReviewing({ id: opp.id, label: opp.title, approving: false })}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant={opp.removedByAdmin ? 'secondary' : 'danger-subtle'}
                            onClick={() => setTarget({ id: opp.id, label: opp.title, removed: opp.removedByAdmin })}
                          >
                            {opp.removedByAdmin ? 'Restore' : 'Remove'}
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

      {adding && <AdminOpportunityFormModal onClose={() => setAdding(false)} />}
    </div>
  )
}
