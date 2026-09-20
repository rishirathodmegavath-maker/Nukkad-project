import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WalletIcon, ArrowDownLeft, ArrowUpRight, Lock, Banknote } from 'lucide-react'
import { cancelWithdrawal, getMyWallet, listMyTransactions, listMyWithdrawals, requestWithdrawal } from '@/services/wallet.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatMoney, formatRelativeTime } from '@/lib/utils'

const withdrawalStatusTone = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'neutral' } as const

function RequestWithdrawalModal({ balanceMinorUnits, onClose }: { balanceMinorUnits: number; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => requestWithdrawal(Math.round(Number(amount) * 100), note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] })
      toast.success('Withdrawal requested — an admin will review it')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not request this withdrawal'),
    onSettled: () => { submittingRef.current = false },
  })

  // Unlike the admin wallet-adjustment endpoint, requestWithdrawal has no idempotency key -- each
  // call creates a genuinely new, separate withdrawal hold. mutation.isPending only flips true on
  // the render after mutate() is called, so a fast double-click can fire both calls before React
  // re-renders the button as disabled (same gap as OnboardingPage's finish-setup button). This ref
  // is set synchronously, independent of React's render cycle, so the second click is a no-op.
  const submittingRef = useRef(false)
  function handleRequestWithdrawal() {
    if (submittingRef.current) return
    submittingRef.current = true
    mutation.mutate()
  }

  const amountMinorUnits = Math.round((Number(amount) || 0) * 100)
  const isValid = amountMinorUnits > 0 && amountMinorUnits <= balanceMinorUnits

  return (
    <Modal
      open
      onClose={onClose}
      title="Request a withdrawal"
      description="Funds are held from your balance immediately. An admin reviews the request; the payout itself happens outside the app."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button isLoading={mutation.isPending} disabled={!isValid} onClick={handleRequestWithdrawal}>
            Request withdrawal
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Amount (INR)"
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
          hint={`Available: ${formatMoney(balanceMinorUnits)}`}
          error={amount && !isValid ? 'Enter an amount up to your available balance' : undefined}
        />
        <Textarea
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="e.g. where this should be sent"
        />
      </div>
    </Modal>
  )
}

export default function WalletPage() {
  const [page, setPage] = useState(0)
  const [requesting, setRequesting] = useState(false)
  const queryClient = useQueryClient()

  const walletQuery = useQuery({ queryKey: ['wallet', 'me'], queryFn: getMyWallet })
  const txnsQuery = useQuery({
    queryKey: ['wallet', 'me', 'transactions', page],
    queryFn: () => listMyTransactions(page, 20),
  })
  const withdrawalsQuery = useQuery({ queryKey: ['wallet', 'me', 'withdrawals'], queryFn: () => listMyWithdrawals(0, 20) })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] })
      toast.success('Withdrawal request cancelled — funds returned to your balance')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel this request'),
  })

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-fg tracking-tight">Wallet</h1>
        <p className="text-sm text-fg-muted mt-1">Your balance and transaction history.</p>
      </div>

      {walletQuery.isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : walletQuery.isError || !walletQuery.data ? (
        <ErrorState title="Couldn't load your wallet" onRetry={walletQuery.refetch} />
      ) : (
        <Card variant="elevated" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <WalletIcon className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">Current balance</p>
              <p className="text-2xl font-bold text-fg tabular-nums">
                {formatMoney(walletQuery.data.balanceMinorUnits, walletQuery.data.currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {walletQuery.data.status === 'FROZEN' ? (
              <Badge tone="danger" size="md">
                <Lock className="size-3" /> Frozen
              </Badge>
            ) : (
              <Button size="sm" leftIcon={<Banknote className="size-3.5" />} onClick={() => setRequesting(true)}>
                Request withdrawal
              </Button>
            )}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-fg-secondary mb-3">Withdrawal requests</h2>
        {withdrawalsQuery.isLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : withdrawalsQuery.isError || !withdrawalsQuery.data ? (
          <ErrorState title="Couldn't load your withdrawal requests" onRetry={withdrawalsQuery.refetch} />
        ) : withdrawalsQuery.data.content.length === 0 ? (
          <p className="text-sm text-fg-muted">No withdrawal requests yet.</p>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {withdrawalsQuery.data.content.map((w) => (
                    <tr key={w.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-fg tabular-nums whitespace-nowrap">
                        {formatMoney(w.amountMinorUnits, w.currency)}
                      </td>
                      <td className="px-4 py-3"><Badge tone={withdrawalStatusTone[w.status]}>{w.status}</Badge></td>
                      <td className="px-4 py-3 text-fg-muted truncate max-w-xs" title={w.decisionNote ?? undefined}>
                        {w.decisionNote ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-right">{formatRelativeTime(w.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === 'PENDING' && (
                          <Button size="sm" variant="danger-subtle" isLoading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(w.id)}>
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-fg-secondary mb-3">Transaction history</h2>

        {txnsQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : txnsQuery.isError || !txnsQuery.data ? (
          <ErrorState title="Couldn't load your transaction history" onRetry={txnsQuery.refetch} />
        ) : txnsQuery.data.content.length === 0 ? (
          <EmptyState
            icon={<WalletIcon className="size-5" />}
            title="No transactions yet"
            description="Credits and debits to your wallet will show up here."
          />
        ) : (
          <>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnsQuery.data.content.map((txn) => (
                      <tr key={txn.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge tone={txn.type === 'CREDIT' ? 'success' : 'neutral'}>
                            {txn.type === 'CREDIT' ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}
                            {txn.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-secondary truncate max-w-xs" title={txn.description ?? undefined}>
                          {txn.description ?? '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap ${
                            txn.type === 'CREDIT' ? 'text-success-600 dark:text-success-400' : 'text-fg'
                          }`}
                        >
                          {txn.type === 'CREDIT' ? '+' : '−'}{formatMoney(txn.amountMinorUnits, txn.currency)}
                        </td>
                        <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-right">
                          {formatRelativeTime(txn.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Pagination
              page={txnsQuery.data.page}
              totalPages={txnsQuery.data.totalPages}
              totalElements={txnsQuery.data.totalElements}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {requesting && walletQuery.data && (
        <RequestWithdrawalModal balanceMinorUnits={walletQuery.data.balanceMinorUnits} onClose={() => setRequesting(false)} />
      )}
    </div>
  )
}
