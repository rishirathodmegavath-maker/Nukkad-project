import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ClipboardList, Rocket } from 'lucide-react'
import { listMyProgramApplications, listPrograms, withdrawProgramApplication } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import type { ProgramApplicationStatus } from '@/types'

const STATUS_TONE: Record<ProgramApplicationStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SUBMITTED: 'accent',
  UNDER_REVIEW: 'accent',
  SHORTLISTED: 'accent',
  SELECTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
}

const STATUS_LABEL: Record<ProgramApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
}

export default function MyProgramApplicationsPage() {
  const queryClient = useQueryClient()
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const { data: applications, isLoading, isError, refetch } = useQuery({
    queryKey: ['program-application', 'mine', 'all'],
    queryFn: listMyProgramApplications,
  })
  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: listPrograms })

  const withdrawMutation = useMutation({
    mutationFn: withdrawProgramApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-application'] })
      toast.success('Application withdrawn')
      setWithdrawingId(null)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not withdraw this application')
      setWithdrawingId(null)
    },
  })

  const programName = (key: string) => programs?.find((p) => p.key === key)?.name ?? key.toUpperCase()
  const canWithdraw = (status: ProgramApplicationStatus) => status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'SHORTLISTED'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">My Applications</h1>
        <p className="mt-1 text-sm text-fg-muted">Track and continue your Startup Program applications.</p>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={2} />
      ) : isError ? (
        <ErrorState title="Couldn't load your applications" onRetry={refetch} />
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No applications yet"
          description="Explore SPARK and IGNITE to find your next step."
          action={
            <Link to="/programs" className={buttonClasses({ size: 'sm' })}>
              <Rocket className="size-3.5" /> Browse programs
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <Card key={application.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-fg">{programName(application.program)}</h2>
                  <Badge tone={STATUS_TONE[application.status]}>{STATUS_LABEL[application.status]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {application.status === 'DRAFT'
                    ? 'Not yet submitted'
                    : `Submitted ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {application.status === 'DRAFT' ? (
                  <Link to={`/programs/${application.program}/apply/start`} className={buttonClasses({ size: 'sm' })}>
                    Continue Application <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to={`/programs/${application.program}/apply`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                    View
                  </Link>
                )}
                {canWithdraw(application.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={withdrawingId === application.id && withdrawMutation.isPending}
                    onClick={() => {
                      setWithdrawingId(application.id)
                      withdrawMutation.mutate(application.id)
                    }}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
