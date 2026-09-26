import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles, Target, Users } from 'lucide-react'
import { getProgram } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/button-styles'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { ErrorState } from '@/components/ui/EmptyState'
import type { ProgramKey } from '@/types'

const VALID_KEYS: ProgramKey[] = ['spark', 'ignite']

export default function ProgramDetailPage() {
  const { key } = useParams<{ key: string }>()
  const normalized = key?.toLowerCase()
  const valid = VALID_KEYS.includes(normalized as ProgramKey)

  const { data: program, isLoading, isError, refetch } = useQuery({
    queryKey: ['program', normalized],
    queryFn: () => getProgram(normalized as ProgramKey),
    enabled: valid,
  })

  if (!valid) return <Navigate to="/programs" replace />
  if (isLoading) return <RouteFallback />
  if (isError || !program) return <ErrorState title="Couldn't load this program" onRetry={refetch} />

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-fg-muted">
        <Link to="/resources" className="hover:text-fg hover:underline">Resources</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link to="/programs" className="hover:text-fg hover:underline">Startup Programs</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="font-medium text-fg">{program.name}</span>
      </nav>

      <section className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent p-6 sm:p-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">{program.name}</h1>
          <p className="mt-2 text-lg font-semibold text-fg-brand">{program.tagline}</p>
        </div>
        <p className="max-w-2xl text-fg-secondary">{program.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          {!program.applicationOpen && <Badge tone="neutral">Applications currently closed</Badge>}
          {program.selective === true && <Badge tone="accent">Selective process</Badge>}
          {program.feeAmount != null && (
            <Badge tone="neutral">
              Fee: {program.feeCurrency ?? ''} {program.feeAmount}
            </Badge>
          )}
          {program.enrollmentInfo && <Badge tone="neutral">{program.enrollmentInfo}</Badge>}
        </div>

        <div>
          {program.applicationOpen ? (
            <Link to={`/programs/${program.key}/apply`} className={buttonClasses({ size: 'lg' })}>
              Apply for {program.name} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true" className={buttonClasses({ size: 'lg', className: 'opacity-50 pointer-events-none' })}>
              Apply for {program.name} <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          )}
          {!program.applicationOpen && (
            <p className="mt-2 text-sm text-fg-muted">Applications aren't open for {program.name} right now.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="journey-heading">
        <h2 id="journey-heading" className="mb-4 text-xl font-bold tracking-tight text-fg">The {program.name} journey</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {program.journey.map((phase) => (
            <Card key={phase.number} className="flex flex-col gap-2">
              <span className="text-xs font-bold tracking-wide text-fg-muted">{String(phase.number).padStart(2, '0')}</span>
              <h3 className="text-base font-bold text-fg">{phase.title}</h3>
              <p className="text-sm text-fg-secondary">{phase.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="benefits-heading" className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 id="benefits-heading" className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-fg">
            <Sparkles className="size-5 text-fg-brand" aria-hidden="true" /> What you'll get
          </h2>
          <ul className="flex flex-col gap-2.5">
            {program.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-fg-secondary">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-fg">
            <Users className="size-5 text-fg-brand" aria-hidden="true" /> Who is this for?
          </h2>
          <ul className="flex flex-col gap-2.5">
            {program.targetAudience.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-fg-secondary">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="outcome-heading" className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6 sm:p-8">
        <h2 id="outcome-heading" className="mb-2 flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
          <Target className="size-5 text-fg-brand" aria-hidden="true" /> The outcome
        </h2>
        <p className="text-fg-secondary">{program.outcome}</p>
      </section>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-surface p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-fg">Ready to start?</h2>
        <p className="max-w-md text-sm text-fg-secondary">
          Applying takes about 10 minutes. You can save your progress and come back any time.
        </p>
        {program.applicationOpen ? (
          <Link to={`/programs/${program.key}/apply`} className={buttonClasses({ size: 'lg' })}>
            Apply for {program.name} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span aria-disabled="true" className={buttonClasses({ size: 'lg', className: 'opacity-50 pointer-events-none' })}>
            Apply for {program.name} <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </section>
    </div>
  )
}
