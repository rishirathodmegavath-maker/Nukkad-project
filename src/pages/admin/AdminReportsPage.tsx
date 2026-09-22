import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Lock } from 'lucide-react'
import { getAdminPost, listAdminReports, resolveReport } from '@/services/admin.service'
import type { AdminReport, ReportStatus } from '@/types/admin'
import { PillTabs } from '@/components/ui/Tabs'
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

const STATUS_FILTERS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
  { key: 'all', label: 'All' },
]

const CATEGORIES = [
  'Harassment', 'Spam', 'Scam or fraud', 'Hate speech', 'Impersonation', 'Inappropriate content',
  'Fake profile', 'Solicitation', 'Off-platform payment request', 'Intellectual property', 'Underage user', 'Other',
]

const statusTone = { OPEN: 'warning', RESOLVED: 'success', DISMISSED: 'neutral' } as const

function PrivateConversationNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-surface-sunken px-3.5 py-3 text-sm text-fg-muted">
      <Lock className="size-4 shrink-0 mt-0.5" />
      <span>
        Private messages are encrypted and can't be read from the admin panel. Decide using the report
        category and the reported user's record instead.
      </span>
    </div>
  )
}

function PostEvidence({ report }: { report: AdminReport }) {
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['admin', 'feed', 'posts', report.postId],
    queryFn: () => getAdminPost(report.postId!),
    enabled: !!report.postId,
  })

  if (isLoading) return <Skeleton className="h-20 rounded-lg" />
  if (isError || !post) return <p className="text-sm text-danger-500">Couldn't load the reported post.</p>

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-surface-sunken p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-danger-500">{report.reportedUserName ?? 'Reported user'}</span>
        <span className="text-fg-muted">{formatRelativeTime(post.createdAt)}</span>
        {post.removedByAdmin && <Badge tone="danger" size="sm">Already removed</Badge>}
      </div>
      <p className="text-sm text-fg whitespace-pre-wrap break-words">{post.content || <em>(attachment only)</em>}</p>
      <Link to="/admin/feed" className="text-xs font-semibold text-fg-brand hover:underline self-start">
        Manage in Admin Feed →
      </Link>
    </div>
  )
}

function ResolveModal({ report, onClose }: { report: AdminReport | null; onClose: () => void }) {
  const [note, setNote] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (status: 'RESOLVED' | 'DISMISSED') => resolveReport(report!.id, status, note || undefined),
    onSuccess: () => {
      toast.success('Report reviewed')
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      onClose()
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to resolve report'),
  })

  if (!report) return null
  const isOpen = report.status === 'OPEN'

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title={isOpen ? 'Review this report' : 'Report evidence'}
      description={`${report.reporterName ?? 'A user'} reported ${report.reportedUserName ?? 'a user'} for "${report.category}".`}
      footer={
        isOpen ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="outline" isLoading={mutation.isPending} onClick={() => mutation.mutate('DISMISSED')}>
              Dismiss
            </Button>
            <Button variant="primary" isLoading={mutation.isPending} onClick={() => mutation.mutate('RESOLVED')}>
              Mark resolved
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-fg">{report.postId ? 'Reported post' : 'Reported conversation'}</p>
          {report.postId ? <PostEvidence report={report} /> : <PrivateConversationNotice />}
        </div>
        {isOpen ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resolution-note" className="text-sm font-medium text-fg">
              Resolution note (optional, recorded in the audit log)
            </label>
            <textarea
              id="resolution-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="What action was taken, if any"
            />
          </div>
        ) : (
          report.resolutionNote && (
            <p className="text-xs text-fg-muted">
              Reviewed by {report.resolvedByName ?? 'an admin'} — "{report.resolutionNote}"
            </p>
          )
        )}
      </div>
    </Modal>
  )
}

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') ?? 'OPEN')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [reviewing, setReviewing] = useState<AdminReport | null>(null)

  useEffect(() => {
    const next = new URLSearchParams()
    if (status !== 'OPEN') next.set('status', status)
    if (category) next.set('category', category)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [status, category, page, setSearchParams])

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : (status as ReportStatus),
      category: category || undefined,
      page,
      size: 20,
    }),
    [status, category, page],
  )

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'reports', filters],
    queryFn: () => listAdminReports(filters),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <PillTabs items={STATUS_FILTERS} value={status} onChange={(k) => { setStatus(k); setPage(0) }} />
        <Select
          label="Category"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0) }}
          className="w-56"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load reports" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<Flag className="size-5" />} title="No reports" description="Nothing matches this filter right now." />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((report) => (
              <Card key={report.id} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone={statusTone[report.status]}>{report.status}</Badge>
                    <Badge tone="neutral">{report.category}</Badge>
                    <span className="text-xs text-fg-muted">{formatRelativeTime(report.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg">
                    <span className="font-medium">{report.reporterName ?? 'Unknown user'}</span> reported{' '}
                    {report.postId ? 'a post by ' : ''}
                    <Link to={`/admin/users/${report.reportedUserId}`} className="font-medium text-fg-brand hover:underline">
                      {report.reportedUserName ?? 'Unknown user'}
                    </Link>
                  </p>
                  {report.status !== 'OPEN' && (
                    <p className="text-xs text-fg-muted mt-1.5">
                      Reviewed by {report.resolvedByName ?? 'an admin'} {report.resolvedAt && formatRelativeTime(report.resolvedAt)}
                      {report.resolutionNote && ` — "${report.resolutionNote}"`}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => setReviewing(report)}>
                  {report.status === 'OPEN' ? 'Review' : 'View evidence'}
                </Button>
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      <ResolveModal report={reviewing} onClose={() => setReviewing(null)} />
    </div>
  )
}
