import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, X, History } from 'lucide-react'
import {
  previewAdminInvestorImport,
  startAdminInvestorImport,
  getAdminInvestorImport,
  listAdminInvestorImports,
  listAdminInvestorImportIssues,
  type AdminInvestorImportPreview,
  type AdminInvestorImportBatch,
} from '@/services/admin.service'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

const ACTIVE_STATUSES = new Set(['PENDING', 'PROCESSING'])

function statusTone(status: string): 'neutral' | 'warning' | 'success' | 'danger' {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'warning'
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
      <div className="h-full bg-brand-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

function BatchIssuesModal({ batch, onClose }: { batch: AdminInvestorImportBatch; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'investor-catalog', 'import', batch.id, 'issues', page],
    queryFn: () => listAdminInvestorImportIssues(batch.id, { page, size: 20 }),
  })

  return (
    <Modal open onClose={onClose} title={`Issue log — ${batch.originalFilename ?? 'import'}`} size="lg">
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : isError || !data ? (
          <ErrorState title="Couldn't load the issue log" onRetry={refetch} />
        ) : data.content.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-5" />} title="No issues" description="Every row in this file imported cleanly." />
        ) : (
          <>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
              {data.content.map((issue) => (
                <div key={issue.id} className="flex items-start gap-2.5 rounded-lg border border-border/70 p-3">
                  {issue.severity === 'ERROR' ? (
                    <XCircle className="size-4 shrink-0 text-danger-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-fg-muted">
                      Row {issue.rowNumber}
                      {issue.investorName && ` · ${issue.investorName}`}
                      {issue.externalSourceId && ` · id: ${issue.externalSourceId}`}
                    </p>
                    <p className="text-sm text-fg mt-0.5">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </div>
    </Modal>
  )
}

function BatchReportCard({ batch, onViewIssues }: { batch: AdminInvestorImportBatch; onViewIssues: () => void }) {
  const active = ACTIVE_STATUSES.has(batch.status)
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="size-4 text-fg-muted shrink-0" />
          <p className="font-medium text-fg truncate">{batch.originalFilename ?? 'Investor import'}</p>
          <Badge tone={statusTone(batch.status)}>{batch.status === 'PROCESSING' ? 'Importing…' : batch.status === 'PENDING' ? 'Starting…' : batch.status === 'COMPLETED' ? 'Completed' : 'Failed'}</Badge>
        </div>
        <span className="text-xs text-fg-muted">{formatRelativeTime(batch.createdAt)}</span>
      </div>

      {active && (
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={batch.processedRows} total={batch.totalRows} />
          <p className="text-xs text-fg-muted tabular-nums">{batch.processedRows} / {batch.totalRows} rows processed</p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span><span className="font-semibold text-fg tabular-nums">{batch.createdCount}</span> <span className="text-fg-muted">created</span></span>
        <span><span className="font-semibold text-fg tabular-nums">{batch.updatedCount}</span> <span className="text-fg-muted">updated</span></span>
        <span><span className="font-semibold text-fg tabular-nums">{batch.skippedCount}</span> <span className="text-fg-muted">skipped</span></span>
        <span><span className="font-semibold text-fg tabular-nums">{batch.failedCount}</span> <span className="text-fg-muted">failed</span></span>
      </div>

      {batch.errorMessage && (
        <p className="text-xs text-danger-600 dark:text-danger-400">{batch.errorMessage}</p>
      )}

      {!active && (
        <Button size="sm" variant="secondary" className="self-start" onClick={onViewIssues}>
          View issue log
        </Button>
      )}
    </Card>
  )
}

function ImportHistory({ onViewIssues }: { onViewIssues: (batch: AdminInvestorImportBatch) => void }) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'investor-catalog', 'import', 'history', page],
    queryFn: () => listAdminInvestorImports({ page, size: 10 }),
  })

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-fg">
        <History className="size-4 text-fg-muted" /> Import history
      </h3>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load import history" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState title="No imports yet" description="Uploaded CSV files will show up here." />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.content.map((batch) => (
              <Card key={batch.id} padding="sm" className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileSpreadsheet className="size-4 text-fg-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{batch.originalFilename ?? 'Investor import'}</p>
                    <p className="text-xs text-fg-muted">
                      {batch.createdCount} created · {batch.updatedCount} updated · {batch.skippedCount} skipped · {batch.failedCount} failed ·{' '}
                      {formatRelativeTime(batch.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={statusTone(batch.status)}>{batch.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => onViewIssues(batch)}>
                    Issues
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

/** Admin investor catalog's primary way to populate the database — bulk CSV import. Two deliberate steps:
 *  preview (parses and validates, saves nothing) then confirm (actually imports, off-request — see
 *  InvestorImportService on the backend). The same flow handles a 10-row file and, later, a 100,000-row one. */
export function AdminInvestorImportPanel() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AdminInvestorImportPreview | null>(null)
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [issuesBatch, setIssuesBatch] = useState<AdminInvestorImportBatch | null>(null)

  const previewMutation = useMutation({
    mutationFn: (file: File) => previewAdminInvestorImport(file),
    onSuccess: (result) => setPreview(result),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not read this file')
      setPickedFile(null)
    },
  })

  const startMutation = useMutation({
    mutationFn: (file: File) => startAdminInvestorImport(file),
    onSuccess: (batch) => {
      setActiveBatchId(batch.id)
      setPreview(null)
      setPickedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['admin', 'investor-catalog', 'import', 'history'] })
      toast.success(`Import started — ${batch.totalRows} rows queued`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not start this import'),
  })

  const batchQuery = useQuery({
    queryKey: ['admin', 'investor-catalog', 'import', activeBatchId],
    queryFn: () => getAdminInvestorImport(activeBatchId!),
    enabled: !!activeBatchId,
    refetchInterval: (query) => (ACTIVE_STATUSES.has(query.state.data?.status ?? '') ? 1200 : false),
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPickedFile(file)
    setPreview(null)
    if (file) previewMutation.mutate(file)
  }

  function reset() {
    setPickedFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const finishedBatch = batchQuery.data && !ACTIVE_STATUSES.has(batchQuery.data.status) ? batchQuery.data : null

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-fg">Bulk import from CSV</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Upload investors in bulk instead of adding them one by one. Re-uploading the same file later updates
            matching rows (by the source "id" column) instead of duplicating them.
          </p>
        </div>

        {!pickedFile && !batchQuery.data && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-surface-sunken/40 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-500/5">
            <UploadCloud className="size-7 text-fg-muted" />
            <span className="text-sm font-semibold text-fg">Click to choose a CSV file</span>
            <span className="text-xs text-fg-muted">company_name, investor_type, location, industries, and the other investor columns</span>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {previewMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Skeleton className="size-4 rounded-full" /> Reading {pickedFile?.name}…
          </div>
        )}

        {preview && pickedFile && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-sunken/40 p-4">
              <div>
                <p className="text-sm font-semibold text-fg">{pickedFile.name}</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {preview.totalRows} rows · {preview.detectedColumns.length} columns detected
                  {!preview.hasIdColumn && ' · no "id" column — re-imports will always create new rows'}
                </p>
              </div>
              <Button variant="ghost" size="sm" leftIcon={<X className="size-3.5" />} onClick={reset}>
                Choose a different file
              </Button>
            </div>

            {preview.unrecognizedColumns.length > 0 && (
              <p className="text-xs text-fg-muted">
                Not mapped to any field (ignored): {preview.unrecognizedColumns.join(', ')}
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-surface-sunken/60 text-xs font-semibold text-fg-muted">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {preview.sampleRows.map((row) => (
                    <tr key={row.rowNumber} className={row.error ? 'bg-danger-50/60 dark:bg-danger-950/20' : undefined}>
                      <td className="px-3 py-2 text-fg-muted tabular-nums">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-fg">{row.name ?? <span className="text-fg-muted italic">—</span>}</td>
                      <td className="px-3 py-2 text-fg-secondary">{row.investorType ?? '—'}</td>
                      <td className="px-3 py-2 text-fg-secondary">{[row.location, row.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-danger-600 dark:text-danger-400">
                            <XCircle className="size-3.5" /> {row.error}
                          </span>
                        ) : row.warnings.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3.5" /> {row.warnings.join('; ')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-fg-muted">
                            <CheckCircle2 className="size-3.5 text-emerald-500" /> Looks good
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.totalRows > preview.sampleRows.length && (
              <p className="text-xs text-fg-muted">Showing the first {preview.sampleRows.length} of {preview.totalRows} rows.</p>
            )}

            <Button isLoading={startMutation.isPending} onClick={() => startMutation.mutate(pickedFile)} className="self-start">
              Import {preview.totalRows} investor{preview.totalRows === 1 ? '' : 's'}
            </Button>
          </div>
        )}

        {batchQuery.data && (
          <div className="flex flex-col gap-3">
            <BatchReportCard batch={batchQuery.data} onViewIssues={() => setIssuesBatch(batchQuery.data!)} />
            {finishedBatch && (
              <Button variant="secondary" size="sm" className="self-start" onClick={() => setActiveBatchId(null)}>
                Start another import
              </Button>
            )}
          </div>
        )}
      </Card>

      <ImportHistory onViewIssues={setIssuesBatch} />

      {issuesBatch && <BatchIssuesModal batch={issuesBatch} onClose={() => setIssuesBatch(null)} />}
    </div>
  )
}
