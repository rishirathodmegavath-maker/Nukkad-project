import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  bulkDeleteAdminInvestors,
  closeAdminInvestorIntroduction,
  deleteAdminInvestor,
  listAdminInvestorIntroductions,
  listAdminInvestors,
  type AdminInvestorRow,
} from '@/services/admin.service'
import { AdminInvestorFormModal } from '@/components/domain/AdminInvestorFormModal'
import { AdminInvestorImportPanel } from '@/components/domain/AdminInvestorImportPanel'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { InvestorType } from '@/types'

const INVESTOR_TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']

function CatalogTab() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive' | 'hidden'>('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState<{ investor?: AdminInvestorRow } | null>(null)
  const [deleting, setDeleting] = useState<AdminInvestorRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const queryClient = useQueryClient()

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filters = useMemo(
    () => ({
      q: q || undefined,
      type: (type || undefined) as InvestorType | undefined,
      active: status === 'active' ? true : status === 'inactive' ? false : undefined,
      visible: status === 'hidden' ? false : undefined,
      page,
      size: 20,
    }),
    [q, type, status, page],
  )

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'investor-catalog', filters], queryFn: () => listAdminInvestors(filters) })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminInvestor(deleting!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'investor-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['investor-catalog'] })
      toast.success('Investor deleted')
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete this investor'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: () => bulkDeleteAdminInvestors(Array.from(selectedIds)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'investor-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['investor-catalog'] })
      toast.success(`${selectedIds.size} investor${selectedIds.size === 1 ? '' : 's'} deleted`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete the selected investors'),
  })

  return (
    <div>
      <SearchFilterBar inline query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search investors by name, description or location…">
        <Select aria-label="Filter by type" value={type} onChange={(e) => { setType(e.target.value); setPage(0) }} className="w-44">
          <option value="">All types</option>
          {INVESTOR_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0) }} className="w-44">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="hidden">Hidden</option>
        </Select>
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setForm({})}>
          Add investor
        </Button>
      </SearchFilterBar>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-sunken/50 px-4 py-2.5">
          <p className="text-sm font-medium text-fg">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button size="sm" variant="danger-subtle" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load investors" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={<Landmark className="size-5" />}
          title={q || type || status ? 'No investors match' : 'No investors yet'}
          description={q || type || status ? undefined : 'Add the first investor for founders to discover.'}
          action={
            q || type || status ? undefined : (
              <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setForm({})}>
                Add investor
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((investor) => (
              <Card key={investor.id} className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${investor.name}`}
                    checked={selectedIds.has(investor.id)}
                    onChange={() => toggleSelected(investor.id)}
                    className="size-4 shrink-0 cursor-pointer rounded-md border-border accent-[var(--color-brand-600)]"
                  />
                  <Avatar src={investor.logoUrl ?? undefined} name={investor.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-fg truncate">{investor.name}</p>
                      <Badge tone="neutral">{investor.investorType}</Badge>
                      {!investor.active && <Badge tone="danger">Inactive</Badge>}
                      {!investor.visible && <Badge tone="warning">Hidden</Badge>}
                      {investor.linkedInvestorProfileName && <Badge tone="success">Linked account</Badge>}
                      {investor.externalSourceId && <Badge tone="info">Imported</Badge>}
                    </div>
                    <p className="text-xs text-fg-muted">
                      {[investor.location, investor.country].filter(Boolean).join(', ') || 'No location set'}
                      {(investor.chequeMin != null || investor.chequeMax != null) &&
                        ` · ${investor.chequeMin != null ? formatCurrency(investor.chequeMin) : 'Any'}–${investor.chequeMax != null ? formatCurrency(investor.chequeMax) : 'Any'}`}
                      {(investor.investmentCount != null || investor.exitCount != null) &&
                        ` · ${investor.investmentCount ?? 0} investments, ${investor.exitCount ?? 0} exits`}
                      {' · Added '}{formatRelativeTime(investor.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="secondary" leftIcon={<Pencil className="size-3.5" />} onClick={() => setForm({ investor })}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger-subtle" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setDeleting(investor)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      {form && <AdminInvestorFormModal investor={form.investor} onClose={() => setForm(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this investor?"
        description={deleting ? `"${deleting.name}" will no longer appear in Investor Discovery. This can't be undone.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete investor
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">The action is recorded in the audit log.</p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedIds.size} investor${selectedIds.size === 1 ? '' : 's'}?`}
        description="This permanently removes the selected investor records. This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={bulkDeleteMutation.isPending} onClick={() => bulkDeleteMutation.mutate()}>
              Delete {selectedIds.size} Investor{selectedIds.size === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">The action is recorded in the audit log, one entry per investor.</p>
      </Modal>
    </div>
  )
}

function IntroductionsTab() {
  const [status, setStatus] = useState<'PENDING' | 'CLOSED' | ''>('PENDING')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'investor-catalog', 'introductions', status, page],
    queryFn: () => listAdminInvestorIntroductions({ status: status || undefined, page, size: 20 }),
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeAdminInvestorIntroduction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'investor-catalog', 'introductions'] })
      toast.success('Marked as followed up')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this request'),
  })

  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-fg-muted">
        Requests to investors that aren't linked to a live BuildAdda account — there's no one to notify in-app, so
        these are recorded here for the team to follow up on directly, then marked as followed up.
      </p>
      <div className="mb-4 flex items-end gap-3">
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0) }} className="w-48">
          <option value="PENDING">Pending</option>
          <option value="CLOSED">Followed up</option>
          <option value="">All</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load introduction requests" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Landmark className="size-5" />} title="No requests match" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((req) => (
              <Card key={req.id} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone={req.status === 'PENDING' ? 'warning' : 'success'}>{req.status === 'PENDING' ? 'Pending' : 'Followed up'}</Badge>
                    <span className="text-xs text-fg-muted">{formatRelativeTime(req.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg">
                    <span className="font-medium">{req.startupName ?? 'A startup'}</span> requested an introduction to{' '}
                    <span className="font-medium">{req.investorName ?? 'this investor'}</span>
                  </p>
                  <p className="text-xs text-fg-muted mt-1 max-w-xl">"{req.message}"</p>
                </div>
                {req.status === 'PENDING' && (
                  <Button size="sm" variant="secondary" isLoading={closeMutation.isPending} onClick={() => closeMutation.mutate(req.id)}>
                    Mark followed up
                  </Button>
                )}
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

/** Investor Discovery's admin side: the catalog founders search, plus the requests that had nowhere else to go
 *  (an unlinked investor has no live account to notify) — see AdminInvestorFormModal and InvestorCatalogService. */
export default function AdminInvestorCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as 'catalog' | 'import' | 'introductions') || 'catalog'

  return (
    <div>
      <Tabs
        value={tab}
        onChange={(k) => setSearchParams(k === 'catalog' ? {} : { tab: k })}
        items={[
          { key: 'catalog', label: 'Catalog' },
          { key: 'import', label: 'Import' },
          { key: 'introductions', label: 'Introduction requests' },
        ]}
        className="mb-6"
      />
      {tab === 'catalog' ? <CatalogTab /> : tab === 'import' ? <AdminInvestorImportPanel /> : <IntroductionsTab />}
    </div>
  )
}
