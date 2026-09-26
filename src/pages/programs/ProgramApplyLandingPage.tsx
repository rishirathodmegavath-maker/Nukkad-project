import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, ChevronRight, ClipboardList, ListChecks, Users } from 'lucide-react'
import { getMyProgramApplication, getProgram } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { buttonClasses } from '@/components/ui/button-styles'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { ErrorState } from '@/components/ui/EmptyState'
import type { ProgramKey } from '@/types'

const VALID_KEYS: ProgramKey[] = ['spark', 'ignite']

const STATUS_COPY: Record<string, string> = {
  SUBMITTED: 'Your application has been submitted and is waiting to be reviewed.',
  UNDER_REVIEW: 'Your application is currently under review.',
  SHORTLISTED: "You've been shortlisted — we'll be in touch with next steps.",
  SELECTED: "Congratulations — you've been selected!",
}

export default function ProgramApplyLandingPage() {
  const { key } = useParams<{ key: string }>()
  const normalized = key?.toLowerCase()
  const valid = VALID_KEYS.includes(normalized as ProgramKey)
  const programKey = normalized as ProgramKey

  const { data: program, isLoading, isError, refetch } = useQuery({
    queryKey: ['program', normalized],
    queryFn: () => getProgram(programKey),
    enabled: valid,
  })
  const { data: myApplication, isLoading: isLoadingMine } = useQuery({
    queryKey: ['program-application', 'mine', normalized],
    queryFn: () => getMyProgramApplication(programKey),
    enabled: valid,
  })

  if (!valid) return <Navigate to="/programs" replace />
  if (isLoading || isLoadingMine) return <RouteFallback />
  if (isError || !program) return <ErrorState title="Couldn't load this program" onRetry={refetch} />

  const inReview = myApplication && myApplication.status !== 'DRAFT' && myApplication.status !== 'REJECTED' && myApplication.status !== 'WITHDRAWN'
  const canReapply = myApplication && (myApplication.status === 'REJECTED' || myApplication.status === 'WITHDRAWN')
  const ctaLabel = myApplication?.status === 'DRAFT' ? 'Continue Application' : 'Start Application'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-fg-muted">
        <Link to="/programs" className="hover:text-fg hover:underline">Startup Programs</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link to={`/programs/${program.key}`} className="hover:text-fg hover:underline">{program.name}</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="font-medium text-fg">Apply</span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">Apply for {program.name}</h1>
        <p className="mt-1 font-medium text-fg-brand">{program.tagline}</p>
        <p className="mt-3 text-fg-secondary">{program.description}</p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-fg">
          <Users className="size-4.5 text-fg-brand" aria-hidden="true" /> Who can apply
        </h2>
        <p className="text-sm text-fg-secondary">{program.targetAudience.join(' · ')}</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-fg">
          <ListChecks className="size-4.5 text-fg-brand" aria-hidden="true" /> Application process
        </h2>
        <ol className="flex flex-col gap-1.5">
          {program.applicationSteps.map((step, i) => (
            <li key={step.id} className="flex items-center gap-2 text-sm text-fg-secondary">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-fg-brand">
                {i + 1}
              </span>
              {step.title}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-fg">
          <ClipboardList className="size-4.5 text-fg-brand" aria-hidden="true" /> Before you start
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-fg-secondary">
          <li>You can save your progress and come back to finish it later.</li>
          <li>Once submitted, you won't be able to edit your answers.</li>
          {program.selective === true && <li>This is a selective process — not every applicant is admitted.</li>}
        </ul>
      </Card>

      {inReview ? (
        <Card className="flex items-start gap-3 border-brand-500/30 bg-brand-500/5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-brand" aria-hidden="true" />
          <div>
            <p className="font-semibold text-fg">{STATUS_COPY[myApplication!.status] ?? 'Your application has already been submitted.'}</p>
            <Link to="/programs/mine" className="mt-2 inline-block text-sm font-semibold text-fg-brand hover:underline">
              View your application
            </Link>
          </div>
        </Card>
      ) : !program.applicationOpen ? (
        <Card className="flex items-start gap-3 border-border-strong">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-muted" aria-hidden="true" />
          <p className="text-sm text-fg-secondary">Applications for {program.name} aren't open right now.</p>
        </Card>
      ) : (
        <div>
          <Link to={`/programs/${program.key}/apply/start`} className={buttonClasses({ size: 'lg' })}>
            {canReapply ? 'Start a new application' : ctaLabel} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
