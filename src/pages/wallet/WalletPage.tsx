import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WalletIcon, ArrowDownLeft, ArrowUpRight, Lock, Banknote, KeyRound } from 'lucide-react'
import { cancelWithdrawal, getMyWallet, listMyTransactions, listMyWithdrawals, requestWithdrawal } from '@/services/wallet.service'
import { getWalletPinStatus } from '@/services/wallet-pin.service'
import { ApiError } from '@/lib/api-client'
import { clearWalletUnlock, getWalletUnlockExpiry } from '@/lib/wallet-unlock'
import { ChangePinModal, CreatePinCard, ResetPinCard, UnlockCard } from './WalletPinScreens'
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

/** The server says the wallet is locked (the PIN session expired, or a lockout started elsewhere). */
const isWalletLockedError = (err: unknown) => err instanceof ApiError && err.errorCode === 'WALLET_LOCKED'

function WalletContent({ onLock, onChangePin }: { onLock: () => void; onChangePin: () => void }) {
  const [page, setPage] = useState(0)
  const [requesting, setRequesting] = useState(false)
  const queryClient = useQueryClient()

  const walletQuery = useQuery({ queryKey: ['wallet', 'me'], queryFn: getMyWallet })
  const txnsQuery = useQuery({
    queryKey: ['wallet', 'me', 'transactions', page],
    queryFn: () => listMyTransactions(page, 20),
  })
  const withdrawalsQuery = useQuery({ queryKey: ['wallet', 'me', 'withdrawals'], queryFn: () => listMyWithdrawals(0, 20) })

  // If any request comes back "locked", go straight to the PIN screen rather than showing an error.
  const lockedByServer = [walletQuery.error, txnsQuery.error, withdrawalsQuery.error].some(isWalletLockedError)
  useEffect(() => {
    if (lockedByServer) onLock()
  }, [lockedByServer, onLock])

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] })
      toast.success('Withdrawal request cancelled — funds returned to your balance')
    },
    onError: (err) => {
      if (isWalletLockedError(err)) onLock()
      toast.error(err instanceof Error ? err.message : 'Could not cancel this request')
    },
  })

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg tracking-tight">Wallet</h1>
          <p className="text-sm text-fg-muted mt-1">Your balance and transaction history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<KeyRound className="size-3.5" />} onClick={onChangePin}>
            Change PIN
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Lock className="size-3.5" />} onClick={onLock}>
            Lock
          </Button>
        </div>
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

/**
 * The wallet is closed until the member enters their PIN: there is no balance, history or withdrawal
 * on screen (and none fetched) before that. Leaving the page, pressing Lock, or letting the PIN
 * session expire closes it again and discards the cached wallet data, so nothing lingers in memory.
 * The real barrier is on the server — every /wallet request is refused without the unlock token.
 */
export default function WalletPage() {
  const queryClient = useQueryClient()
  const [unlocked, setUnlocked] = useState(false)
  const [screen, setScreen] = useState<'unlock' | 'reset'>('unlock')
  const [changingPin, setChangingPin] = useState(false)
  // Bumped whenever a fresh unlock token is issued, so the auto-lock timer restarts for it.
  const [unlockEpoch, setUnlockEpoch] = useState(0)

  const statusQuery = useQuery({
    queryKey: ['wallet-pin', 'status'],
    queryFn: getWalletPinStatus,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  const lock = useCallback(() => {
    clearWalletUnlock()
    setUnlocked(false)
    setScreen('unlock')
    setChangingPin(false)
    queryClient.removeQueries({ queryKey: ['wallet'] })
  }, [queryClient])

  // Leaving the wallet page locks it. (Runs on the first mount too, where there is nothing to clear.)
  useEffect(
    () => () => {
      clearWalletUnlock()
      queryClient.removeQueries({ queryKey: ['wallet'] })
    },
    [queryClient],
  )

  // Close the wallet by itself when the PIN session runs out.
  useEffect(() => {
    if (!unlocked) return
    const timer = setTimeout(lock, Math.max(0, getWalletUnlockExpiry() - Date.now()))
    return () => clearTimeout(timer)
  }, [unlocked, unlockEpoch, lock])

  const refetchStatus = statusQuery.refetch
  const handleUnlocked = useCallback(() => {
    setUnlocked(true)
    setUnlockEpoch((n) => n + 1)
    refetchStatus()
  }, [refetchStatus])

  if (statusQuery.isLoading) return <Skeleton className="mx-auto h-72 max-w-md rounded-xl" />
  if (statusQuery.isError || !statusQuery.data) {
    return <ErrorState title="Couldn't open your wallet" onRetry={statusQuery.refetch} />
  }

  if (unlocked) {
    return (
      <>
        <WalletContent onLock={lock} onChangePin={() => setChangingPin(true)} />
        {changingPin && (
          <ChangePinModal onClose={() => setChangingPin(false)} onChanged={() => setUnlockEpoch((n) => n + 1)} />
        )}
      </>
    )
  }

  if (!statusQuery.data.hasPin) return <CreatePinCard onUnlocked={handleUnlocked} />
  if (screen === 'reset') return <ResetPinCard onUnlocked={handleUnlocked} onCancel={() => setScreen('unlock')} />

  return (
    <UnlockCard
      lockedUntilMs={statusQuery.dataUpdatedAt + statusQuery.data.lockedForSeconds * 1000}
      onUnlocked={handleUnlocked}
      onForgot={() => setScreen('reset')}
      onLockedOut={() => statusQuery.refetch()}
    />
  )
}
