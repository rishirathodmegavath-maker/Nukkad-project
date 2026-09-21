import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldCheck, ShieldOff, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Lock, LockOpen } from 'lucide-react'
import { getAdminUser, updateUserRole, updateUserStatus } from '@/services/admin.service'
import { adjustWalletBalance, getAdminWallet, listAdminWalletTransactions, setWalletStatus } from '@/services/wallet.service'
import type { AccountStatus } from '@/types/admin'
import { getStoredSession } from '@/lib/session'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import { formatMoney, formatRelativeTime } from '@/lib/utils'

const statusTone = { ACTIVE: 'success', SUSPENDED: 'warning', DISABLED: 'danger' } as const

function ConfirmStatusModal({
  open,
  onClose,
  targetStatus,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  targetStatus: AccountStatus | null
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  if (!targetStatus) return null
  const isReactivating = targetStatus === 'ACTIVE'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReactivating ? 'Reactivate this account?' : `${targetStatus === 'SUSPENDED' ? 'Suspend' : 'Disable'} this account?`}
      description={
        isReactivating
          ? 'The user will be able to log in again immediately.'
          : 'This immediately signs the user out of every session and blocks new sign-ins.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={isReactivating ? 'primary' : 'danger'}
            isLoading={isPending}
            onClick={() => onConfirm(reason)}
          >
            {isReactivating ? 'Reactivate' : `Confirm ${targetStatus === 'SUSPENDED' ? 'suspension' : 'disable'}`}
          </Button>
        </>
      }
    >
      {!isReactivating && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status-reason" className="text-sm font-medium text-fg">
            Reason (optional, recorded in the audit log)
          </label>
          <textarea
            id="status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="e.g. repeated harassment reports"
          />
        </div>
      )}
    </Modal>
  )
}

function WalletStatusModal({
  open,
  onClose,
  freezing,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  freezing: boolean
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={freezing ? 'Freeze this wallet?' : 'Unfreeze this wallet?'}
      description={
        freezing
          ? 'Blocks every credit and debit on this wallet, including withdrawal requests, until unfrozen. The current balance is untouched.'
          : 'The wallet becomes active again and can send or receive money as normal.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={freezing ? 'danger' : 'primary'} isLoading={isPending} onClick={() => onConfirm(reason)}>
            {freezing ? 'Freeze wallet' : 'Unfreeze wallet'}
          </Button>
        </>
      }
    >
      {freezing && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wallet-freeze-reason" className="text-sm font-medium text-fg">
            Reason (optional, recorded in the audit log)
          </label>
          <textarea
            id="wallet-freeze-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="e.g. suspected fraudulent withdrawal activity"
          />
        </div>
      )}
    </Modal>
  )
}

function AdjustWalletModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (direction: 'CREDIT' | 'DEBIT', amountMinorUnits: number, reason: string, idempotencyKey: string) => void
  isPending: boolean
}) {
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  // One key per open modal, not per click: a double-click before the button disables reuses this
  // same key so the backend dedupes it to a single adjustment instead of applying it twice.
  const idempotencyKeyRef = useRef(crypto.randomUUID())
  useEffect(() => {
    if (open) idempotencyKeyRef.current = crypto.randomUUID()
  }, [open])

  const amountMinorUnits = Math.round(Number(amount) * 100)
  const canSubmit = amount.trim() !== '' && amountMinorUnits > 0 && reason.trim().length > 0

  function handleClose() {
    setDirection('CREDIT')
    setAmount('')
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adjust wallet balance"
      description="There is no way to set a balance directly — this records a new, reasoned ledger entry. A mandatory reason is required and this action is audited."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            variant={direction === 'DEBIT' ? 'danger' : 'primary'}
            isLoading={isPending}
            disabled={!canSubmit}
            onClick={() => onConfirm(direction, amountMinorUnits, reason.trim(), idempotencyKeyRef.current)}
          >
            {direction === 'CREDIT' ? 'Credit wallet' : 'Debit wallet'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as 'CREDIT' | 'DEBIT')}>
          <option value="CREDIT">Credit (add money)</option>
          <option value="DEBIT">Debit (remove money)</option>
        </Select>
        <Input
          label="Amount (₹)"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 500"
          required
        />
        <Textarea
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. promotional credit, refund correction, manual reconciliation"
          required
        />
      </div>
    </Modal>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentAdminId = getStoredSession()?.userId
  const queryClient = useQueryClient()
  const [statusModalTarget, setStatusModalTarget] = useState<AccountStatus | null>(null)
  const [confirmAdminChange, setConfirmAdminChange] = useState(false)
  const [adjustWalletOpen, setAdjustWalletOpen] = useState(false)
  const [walletStatusModalOpen, setWalletStatusModalOpen] = useState(false)

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getAdminUser(id!),
    enabled: !!id,
  })

  const walletQuery = useQuery({
    queryKey: ['admin', 'wallets', id],
    queryFn: () => getAdminWallet(id!),
    enabled: !!id,
  })
  const walletTxnsQuery = useQuery({
    queryKey: ['admin', 'wallets', id, 'transactions'],
    queryFn: () => listAdminWalletTransactions(id!, 0, 5),
    enabled: !!id,
  })

  const adjustWalletMutation = useMutation({
    mutationFn: (vars: { direction: 'CREDIT' | 'DEBIT'; amountMinorUnits: number; reason: string; idempotencyKey: string }) =>
      adjustWalletBalance(id!, vars),
    onSuccess: () => {
      toast.success('Wallet balance adjusted')
      setAdjustWalletOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets', id] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to adjust wallet balance'),
  })

  const walletStatusMutation = useMutation({
    mutationFn: (vars: { status: 'ACTIVE' | 'FROZEN'; reason?: string }) => setWalletStatus(id!, vars.status, vars.reason),
    onSuccess: (_data, vars) => {
      toast.success(vars.status === 'FROZEN' ? 'Wallet frozen' : 'Wallet unfrozen')
      setWalletStatusModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets', id] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to update wallet status'),
  })

  const statusMutation = useMutation({
    mutationFn: (vars: { status: AccountStatus; reason?: string }) => updateUserStatus(id!, vars.status, vars.reason),
    onSuccess: () => {
      toast.success('Account status updated')
      setStatusModalTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to update status'),
  })

  const roleMutation = useMutation({
    mutationFn: (grant: boolean) => updateUserRole(id!, 'ADMIN', grant),
    onSuccess: () => {
      toast.success('Admin role updated')
      setConfirmAdminChange(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Failed to update role')
      setConfirmAdminChange(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (isError || !user) {
    return <ErrorState title="Couldn't load this user" onRetry={refetch} />
  }

  const isSelf = currentAdminId === user.id
  const isAdmin = user.roles.includes('ADMIN')

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link to="/admin/users" className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary hover:text-fg w-fit">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <Card className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl ?? undefined} name={user.name} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-fg">{user.name}</h2>
            <p className="text-sm text-fg-muted">{user.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.roles.map((r) => (
                <Badge key={r} tone={r === 'ADMIN' ? 'purple' : 'neutral'}>{r}</Badge>
              ))}
              <Badge tone={statusTone[user.status]}>{user.status}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-fg-secondary mb-3">Account details</h3>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-fg-muted">Headline</dt>
            <dd className="text-fg font-medium">{user.headline ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">College / Company</dt>
            <dd className="text-fg font-medium">{user.collegeOrCompany ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Location</dt>
            <dd className="text-fg font-medium">{user.location ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Connections</dt>
            <dd className="text-fg font-medium">{user.connectionsCount}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Joined</dt>
            <dd className="text-fg font-medium">{formatRelativeTime(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Last active</dt>
            <dd className="text-fg font-medium">{user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Email verified</dt>
            <dd className="text-fg font-medium">{user.emailVerified ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Google linked</dt>
            <dd className="text-fg font-medium">{user.googleLinked ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-fg-secondary">Wallet</h3>
          {!isSelf && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={walletQuery.data?.status === 'FROZEN' ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                onClick={() => setWalletStatusModalOpen(true)}
              >
                {walletQuery.data?.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<WalletIcon className="size-3.5" />} onClick={() => setAdjustWalletOpen(true)}>
                Adjust balance
              </Button>
            </div>
          )}
        </div>

        {walletQuery.isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : walletQuery.isError || !walletQuery.data ? (
          <p className="text-sm text-fg-muted">Couldn't load this user's wallet.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-fg tabular-nums">
                {formatMoney(walletQuery.data.balanceMinorUnits, walletQuery.data.currency)}
              </span>
              {walletQuery.data.status === 'FROZEN' && <Badge tone="danger">Frozen</Badge>}
            </div>

            {walletTxnsQuery.data && walletTxnsQuery.data.content.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">Recent transactions</p>
                {walletTxnsQuery.data.content.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge tone={txn.type === 'CREDIT' ? 'success' : 'neutral'} size="sm">
                        {txn.type === 'CREDIT' ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}
                        {txn.type}
                      </Badge>
                      <span className="text-fg-muted truncate" title={txn.description ?? undefined}>
                        {txn.description ?? '—'}
                      </span>
                    </div>
                    <span className="font-medium tabular-nums whitespace-nowrap">
                      {txn.type === 'CREDIT' ? '+' : '−'}{formatMoney(txn.amountMinorUnits, txn.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-fg-muted">No transactions yet.</p>
            )}
          </>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-fg-secondary mb-3">Admin actions</h3>
        {isSelf ? (
          <p className="text-sm text-fg-muted">You cannot change your own account status or admin role from here.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {user.status !== 'ACTIVE' && (
              <Button variant="secondary" onClick={() => setStatusModalTarget('ACTIVE')}>Reactivate</Button>
            )}
            {user.status !== 'SUSPENDED' && (
              <Button variant="secondary" onClick={() => setStatusModalTarget('SUSPENDED')}>Suspend</Button>
            )}
            {user.status !== 'DISABLED' && (
              <Button variant="danger-subtle" onClick={() => setStatusModalTarget('DISABLED')}>Disable</Button>
            )}
            <Button
              variant="outline"
              leftIcon={isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
              onClick={() => setConfirmAdminChange(true)}
            >
              {isAdmin ? 'Revoke admin' : 'Grant admin'}
            </Button>
          </div>
        )}
      </Card>

      <ConfirmStatusModal
        open={statusModalTarget !== null}
        onClose={() => setStatusModalTarget(null)}
        targetStatus={statusModalTarget}
        isPending={statusMutation.isPending}
        onConfirm={(reason) => statusMutation.mutate({ status: statusModalTarget!, reason: reason || undefined })}
      />

      <Modal
        open={confirmAdminChange}
        onClose={() => setConfirmAdminChange(false)}
        title={isAdmin ? 'Revoke admin access?' : 'Grant admin access?'}
        description={
          isAdmin
            ? `${user.name} will immediately lose access to the Admin panel and every /api/admin/** endpoint.`
            : `${user.name} will gain full platform administration access, effective on their next sign-in.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAdminChange(false)}>Cancel</Button>
            <Button
              variant={isAdmin ? 'danger' : 'primary'}
              isLoading={roleMutation.isPending}
              onClick={() => roleMutation.mutate(!isAdmin)}
            >
              {isAdmin ? 'Revoke admin' : 'Grant admin'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">This action is recorded in the audit log.</p>
      </Modal>

      <AdjustWalletModal
        open={adjustWalletOpen}
        onClose={() => setAdjustWalletOpen(false)}
        isPending={adjustWalletMutation.isPending}
        onConfirm={(direction, amountMinorUnits, reason, idempotencyKey) =>
          adjustWalletMutation.mutate({ direction, amountMinorUnits, reason, idempotencyKey })}
      />

      <WalletStatusModal
        open={walletStatusModalOpen}
        onClose={() => setWalletStatusModalOpen(false)}
        freezing={walletQuery.data?.status !== 'FROZEN'}
        isPending={walletStatusMutation.isPending}
        onConfirm={(reason) =>
          walletStatusMutation.mutate({
            status: walletQuery.data?.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN',
            reason: reason || undefined,
          })
        }
      />
    </div>
  )
}
