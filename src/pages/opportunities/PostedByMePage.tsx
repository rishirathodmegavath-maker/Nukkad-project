import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, MapPin, Users, Lock, LockOpen } from 'lucide-react'
import { listMyPosted, closeOpportunity, reopenOpportunity } from '@/services/opportunities.service'
import { PageHeader } from '@/components/domain/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'

export default function PostedByMePage() {
  const queryClient = useQueryClient()
  const { data: opportunities, isLoading, isError, refetch } = useQuery({
    queryKey: ['opportunities', 'mine', 'posted'],
    queryFn: listMyPosted,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['opportunities', 'mine', 'posted'] })

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeOpportunity(id),
    onSuccess: () => {
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not close this opportunity'),
  })

  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopenOpportunity(id),
    onSuccess: () => {
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not reopen this opportunity'),
  })

  return (
    <div>
      <PageHeader title="Posted by Me" description="Opportunities you've posted — including ones still waiting for review — and their applicants." />

      {isLoading ? (
        <CardSkeletonGrid count={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load your posted opportunities" onRetry={refetch} />
      ) : !opportunities || opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="You haven't posted any opportunities"
          description="Post a job, internship, or founding role to reach the BuildAdda community."
          action={
            <Link to="/opportunities/new">
              <Button size="sm">Post an opportunity</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-fg text-base leading-snug truncate">{opp.title}</h3>
                  <p className="text-sm text-fg-muted flex items-center gap-1.5 mt-1 font-medium truncate">
                    <Briefcase className="size-3.5 shrink-0" /> {opp.organizationName}
                  </p>
                  {opp.location && (
                    <p className="text-xs text-fg-muted flex items-center gap-1.5 mt-1 truncate">
                      <MapPin className="size-3.5 shrink-0" /> {opp.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {opp.closed && <Badge tone="neutral">Closed</Badge>}
                  {opp.moderationStatus === 'PENDING' && <Badge tone="warning">Pending review</Badge>}
                  {opp.moderationStatus === 'REJECTED' && <Badge tone="danger">Not approved</Badge>}
                </div>
              </div>
              <p className="text-xs text-fg-muted flex items-center gap-1.5">
                <Users className="size-3.5" /> {opp.applicantCount ?? 0} applicant{(opp.applicantCount ?? 0) === 1 ? '' : 's'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
                <Link to={`/opportunities/${opp.id}`}>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </Link>
                <Link to={`/opportunities/${opp.id}/applications`}>
                  <Button size="sm" variant="secondary">
                    Applications
                  </Button>
                </Link>
                <Link to={`/opportunities/${opp.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                </Link>
                {opp.closed ? (
                  <Button
                    size="sm"
                    leftIcon={<LockOpen className="size-3.5" />}
                    isLoading={reopenMutation.isPending}
                    onClick={() => reopenMutation.mutate(opp.id)}
                  >
                    Reopen
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger-subtle"
                    leftIcon={<Lock className="size-3.5" />}
                    isLoading={closeMutation.isPending}
                    onClick={() => closeMutation.mutate(opp.id)}
                  >
                    Close
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
