import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { changeProgramApplicationStatus, getAdminProgramApplication } from '@/services/admin.service'
import { getProgram } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'
import type { ProgramApplicationStatus, ProgramKey } from '@/types'

const STATUS_TONE: Record<ProgramApplicationStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  DRAFT: 'neutral', SUBMITTED: 'accent', UNDER_REVIEW: 'accent', SHORTLISTED: 'accent',
  SELECTED: 'success', REJECTED: 'danger', WITHDRAWN: 'neutral',
}

/** Only these are ever legal for Admin to set — DRAFT/WITHDRAWN are reachable only by the
 *  applicant themselves (see AdminProgramApplicationService.ADMIN_ASSIGNABLE on the backend). */
const ASSIGNABLE_STATUSES: ProgramApplicationStatus[] = ['UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED']

export default function AdminProgramApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [nextStatus, setNextStatus] = useState<ProgramApplicationStatus | ''>('')
  const [note, setNote] = useState('')

  const { data: application, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'program-application', id],
    queryFn: () => getAdminProgramApplication(id!),
    enabled: !!id,
  })
  const { data: program } = useQuery({
    queryKey: ['program', application?.program.toLowerCase()],
    queryFn: () => getProgram(application!.program.toLowerCase() as ProgramKey),
    enabled: !!application,
  })

  const mutation = useMutation({
    mutationFn: () => changeProgramApplicationStatus(id!, nextStatus as ProgramApplicationStatus, note.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'program-application', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'program-applications'] })
      toast.success('Status updated')
      setNextStatus('')
      setNote('')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update status'),
  })

  if (isLoading) return <RouteFallback />
  if (isError || !application) return <ErrorState title="Couldn't load this application" onRetry={refetch} />

  const canReview = application.status !== 'DRAFT' && application.status !== 'WITHDRAWN'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/admin/program-applications" className="flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to applications
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{application.applicantName ?? 'Unknown applicant'}</h1>
          <p className="text-sm text-fg-muted">{application.applicantEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{application.program}</Badge>
          <Badge tone={STATUS_TONE[application.status]}>{application.status.replace('_', ' ')}</Badge>
        </div>
      </div>

      <Card className="flex flex-col gap-1 text-sm text-fg-muted">
        {application.submittedAt && <p>Submitted {formatRelativeTime(application.submittedAt)}</p>}
        {application.reviewedByName && <p>Last reviewed by {application.reviewedByName} ({application.reviewedAt ? formatRelativeTime(application.reviewedAt) : ''})</p>}
        {application.adminNote && <p className="mt-1 text-fg">Internal note: {application.adminNote}</p>}
      </Card>

      {program && (
        <div className="flex flex-col gap-4">
          {program.applicationSteps.filter((s) => s.fields.length > 0).map((step) => (
            <Card key={step.id} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-fg">{step.title}</h2>
              {step.fields.map((field) => {
                const value = application.answers[field.key]
                if (!value) return null
                return (
                  <div key={field.key} className="text-sm">
                    <span className="text-fg-muted">{field.label}: </span>
                    <span className="font-medium text-fg whitespace-pre-wrap">{field.type === 'MULTISELECT' ? value.split('|').join(', ') : value}</span>
                  </div>
                )
              })}
            </Card>
          ))}
        </div>
      )}

      {canReview && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-fg">Change status</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ProgramApplicationStatus)} aria-label="New status">
              <option value="">Choose a status…</option>
              {ASSIGNABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
            <Button disabled={!nextStatus} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
              Update
            </Button>
          </div>
          <Textarea placeholder="Internal note (not shown to the applicant)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </Card>
      )}
    </div>
  )
}
