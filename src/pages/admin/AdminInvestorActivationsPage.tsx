import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark } from 'lucide-react'
import { approveInvestorActivation, listAdminInvestorActivations, rejectInvestorActivation } from '@/services/admin.service'
import type { AdminInvestorActivationRow } from '@/services/admin.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

const statusTone = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const

function RejectModal({
  request,
  onClose,
  isPending,
  onConfirm,
}: {
  request: AdminInvestorActivationRow
  onClose: () => void
  isPending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`Reject ${request.requesterName ?? 'this'}'s investor application?`}
      description="This notifies the applicant with your reason. They can update their details and apply again."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" isLoading={isPending} disabled={reason.trim().length === 0} onClick={() => onConfirm(reason)}>
            Reject
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="investor-reject-reason" className="text-sm font-medium text-fg">
          Reason (shown to the applicant, and recorded in the audit log)
        </label>
        <textarea
          id="investor-reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="e.g. unable to verify firm affiliation"
        />
      </div>
    </Modal>
  )
}

export default function AdminInvestorActivationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') ?? 'PENDING')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [rejecting, setRejecting] = useState<AdminInvestorActivationRow | null>(null)
  const queryClient = useQueryClient()
  const filters = useMemo(
    () => ({ status: status === 'all' ? undefined : status, page, size: 20 }),
    [status, page],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (status !== 'PENDING') next.set('status', status)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [status, page, setSearchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'investor-activations', filters],
    queryFn: () => listAdminInvestorActivations(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'investor-activations'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveInvestorActivation(id),
    onSuccess: () => {
      invalidate()
      toast.success('Investor application approved — profile created')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not approve this application'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectInvestorActivation(rejecting!.id, reason),
    onSuccess: () => {
      invalidate()
      toast.success('Investor application rejected')
      setRejecting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not reject this application'),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="w-56">
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load investor applications" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Landmark className="size-5" />} title="No applications match" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((req) => (
              <Card key={req.id} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone={statusTone[req.status]}>{req.status}</Badge>
                    <Badge tone="neutral">{req.investorType}</Badge>
                    <span className="text-xs text-fg-muted">{formatRelativeTime(req.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg">
                    <span className="font-medium">{req.requesterName ?? 'Unknown user'}</span>
                    {req.firmName && <span className="text-fg-muted"> · {req.firmName}</span>}
                  </p>
                  {req.thesis && <p className="text-xs text-fg-muted mt-1 max-w-xl line-clamp-2">{req.thesis}</p>}
                  {req.status !== 'PENDING' && req.reviewNote && (
                    <p className="text-xs text-fg-muted mt-1.5">Reason: "{req.reviewNote}"</p>
                  )}
                </div>
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-3 shrink-0">
                    <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(req.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger-subtle" onClick={() => setRejecting(req)}>
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      {rejecting && (
        <RejectModal
          request={rejecting}
          onClose={() => setRejecting(null)}
          isPending={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
        />
      )}
    </div>
  )
}
