import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Settings2 } from 'lucide-react'
import { listAdminProgramApplications } from '@/services/admin.service'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { AdminProgramSettingsModal } from '@/components/domain/AdminProgramSettingsModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatRelativeTime } from '@/lib/utils'
import type { ProgramApplicationStatus, ProgramKey } from '@/types'

const STATUS_TONE: Record<ProgramApplicationStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SUBMITTED: 'accent',
  UNDER_REVIEW: 'accent',
  SHORTLISTED: 'accent',
  SELECTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
}

const STATUSES: ProgramApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'DRAFT']

export default function AdminProgramApplicationsPage() {
  const [q, setQ] = useState('')
  const [program, setProgram] = useState<ProgramKey | ''>('')
  const [status, setStatus] = useState<ProgramApplicationStatus | ''>('')
  const [page, setPage] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const filters = useMemo(() => ({ q: q || undefined, program: program || undefined, status: status || undefined, page, size: 20 }), [q, program, status, page])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'program-applications', filters],
    queryFn: () => listAdminProgramApplications(filters),
  })

  return (
    <div>
      <SearchFilterBar inline query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search applicant by name or email…">
        <Select className="w-auto" value={program} onChange={(e) => { setProgram(e.target.value as ProgramKey | ''); setPage(0) }} aria-label="Filter by program">
          <option value="">All programs</option>
          <option value="spark">SPARK</option>
          <option value="ignite">IGNITE</option>
        </Select>
        <Select className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value as ProgramApplicationStatus | ''); setPage(0) }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Select>
        <Button className="sm:ml-auto" variant="secondary" leftIcon={<Settings2 className="size-4" />} onClick={() => setSettingsOpen(true)}>
          Program settings
        </Button>
      </SearchFilterBar>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load applications" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-5" />} title="No applications match" />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="w-full min-w-[14rem] px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="bg-surface px-4 py-3 md:sticky md:right-0" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((application) => (
                    <tr key={application.id} className="group border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="w-full min-w-[14rem] px-4 py-3">
                        <span className="block font-medium text-fg">{application.applicantName ?? 'Unknown'}</span>
                        <span className="block text-xs text-fg-muted">{application.applicantEmail}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-fg-secondary whitespace-nowrap">{application.program}</td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[application.status]}>{application.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                        {application.submittedAt ? formatRelativeTime(application.submittedAt) : '—'}
                      </td>
                      <td className="bg-surface px-4 py-3 text-right transition-colors group-hover:bg-surface-hover md:sticky md:right-0">
                        <Link to={`/admin/program-applications/${application.id}`} className="text-sm font-semibold text-fg-brand hover:underline">
                          Review
                        </Link>
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

      {settingsOpen && <AdminProgramSettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
