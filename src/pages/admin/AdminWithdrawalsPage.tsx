import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import { approveWithdrawal, listAdminWithdrawals, rejectWithdrawal } from '@/services/wallet.service'
import type { AdminWithdrawal, WithdrawalStatus } from '@/types/wallet'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatMoney, formatRelativeTime } from '@/lib/utils'

const statusTone = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'neutral' } as const

function RejectModal({
  request,
  onClose,
  isPending,
  onConfirm,
}: {
  request: AdminWithdrawal
  onClose: () => void
  isPending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`Reject withdrawal of ${formatMoney(request.amountMinorUnits, request.currency)}?`}
      description="This refunds the held amount back to the user's wallet and notifies them, with your reason."
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
        <label htmlFor="withdrawal-reject-reason" className="text-sm font-medium text-fg">
          Reason (shown to the user, and recorded in the audit log)
        </label>
        <textarea
          id="withdrawal-reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="e.g. suspicious activity, unverifiable request"
        />
      </div>
    </Modal>
  )
}

export default function AdminWithdrawalsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') ?? 'PENDING')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [rejecting, setRejecting] = useState<AdminWithdrawal | null>(null)
  const queryClient = useQueryClient()
  const filters = useMemo(
    () => ({ status: (status === 'all' ? undefined : status) as WithdrawalStatus | undefined, page, size: 20 }),
    [status, page],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (status !== 'PENDING') next.set('status', status)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [status, page, setSearchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'withdrawals', filters],
    queryFn: () => listAdminWithdrawals(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveWithdrawal(id),
    onSuccess: () => {
      invalidate()
      toast.success('Withdrawal approved')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not approve this withdrawal'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectWithdrawal(rejecting!.id, reason),
    onSuccess: () => {
      invalidate()
      toast.success('Withdrawal rejected — funds refunded to the user')
      setRejecting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not reject this withdrawal'),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="w-56">
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load withdrawal requests" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Banknote className="size-5" />} title="No withdrawal requests match" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((w) => (
                    <tr key={w.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg">{w.userName ?? 'Unknown'}</p>
                        <p className="text-xs text-fg-muted">{w.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-fg tabular-nums whitespace-nowrap">
                        {formatMoney(w.amountMinorUnits, w.currency)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted truncate max-w-xs" title={w.note ?? undefined}>{w.note ?? '—'}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone[w.status]}>{w.status}</Badge></td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(w.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-3">
                            <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(w.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="danger-subtle" onClick={() => setRejecting(w)}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {w.status !== 'PENDING' && w.decisionNote && (
                          <span className="text-xs text-fg-muted" title={w.decisionNote}>{w.decisionNote}</span>
                        )}
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
