import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { getMyProgramApplication, getProgram } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { buttonClasses } from '@/components/ui/button-styles'
import { RouteFallback } from '@/components/ui/RouteFallback'
import type { ProgramKey } from '@/types'

const VALID_KEYS: ProgramKey[] = ['spark', 'ignite']

export default function ProgramApplicationConfirmationPage() {
  const { key } = useParams<{ key: string }>()
  const normalized = key?.toLowerCase()
  const valid = VALID_KEYS.includes(normalized as ProgramKey)
  const programKey = normalized as ProgramKey

  const { data: program, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['program', normalized],
    queryFn: () => getProgram(programKey),
    enabled: valid,
  })
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['program-application', 'mine', normalized],
    queryFn: () => getMyProgramApplication(programKey),
    enabled: valid,
  })

  if (!valid) return <Navigate to="/programs" replace />
  if (isLoadingProgram || isLoadingApplication) return <RouteFallback />
  // Landing here without a submitted application (e.g. a bookmarked/shared link) isn't a valid state to show.
  if (!application || application.status === 'DRAFT') return <Navigate to={`/programs/${programKey}/apply`} replace />

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-500/10 text-success-500">
        <CheckCircle2 className="size-8" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Application Submitted!</h1>
        <p className="mt-2 text-fg-secondary">Your application is now under review.</p>
      </div>

      <Card className="w-full text-left">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-fg-muted">Program</dt>
            <dd className="font-semibold text-fg">{program?.name ?? programKey.toUpperCase()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-fg-muted">Status</dt>
            <dd className="font-semibold text-fg">Under Review</dd>
          </div>
          {application.submittedAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-fg-muted">Submitted</dt>
              <dd className="font-semibold text-fg">{new Date(application.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-fg-muted">Reference</dt>
            <dd className="font-mono text-xs font-semibold text-fg">{application.id.slice(0, 8).toUpperCase()}</dd>
          </div>
        </dl>
      </Card>

      <p className="text-sm text-fg-muted">
        We'll notify you here on BuildAdda as soon as there's an update — you can also check your status any time from My Applications.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/programs/mine" className={buttonClasses({ variant: 'secondary' })}>
          View My Applications
        </Link>
        <Link to="/" className={buttonClasses()}>
          Return to BuildAdda
        </Link>
      </div>
    </div>
  )
}
