import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { getOpportunity, listApplications } from '@/services/opportunities.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ApplicationCard } from '@/components/domain/ApplicationCard'
import { ApplicationDetailModal } from '@/components/domain/ApplicationDetailModal'
import { PageHeader } from '@/components/domain/PageHeader'
import { PillTabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import type { Application, ApplicationStatus } from '@/types'

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Shortlisted', label: 'Shortlisted' },
  { key: 'Accepted', label: 'Accepted' },
  { key: 'Rejected', label: 'Rejected' },
]

export default function OpportunityApplicationsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: currentUser } = useCurrentUser()
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null)

  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunity(id!),
    enabled: !!id,
  })

  const { data: applications, isLoading, isError, refetch } = useQuery({
    queryKey: ['opportunities', id, 'applications', statusFilter],
    queryFn: () => listApplications(id!, statusFilter === 'all' ? undefined : (statusFilter as ApplicationStatus)),
    enabled: !!id && !!opp,
  })

  const isOwner = !!currentUser && !!opp && opp.postedByUserId === currentUser.id

  if (oppLoading || (isLoading && !isError)) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeletonGrid count={4} />
      </div>
    )
  }

  if (!opp) {
    return <ErrorState title="Couldn’t load this opportunity" onRetry={refetch} />
  }

  if (!isOwner) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="Only the poster can view applications"
        description="You don't have access to this page."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={opp.title}
        description={
          opp.closed
            ? `Closed · ${opp.applicantCount ?? 0} application${(opp.applicantCount ?? 0) === 1 ? '' : 's'} on file`
            : `${opp.applicantCount ?? 0} application${(opp.applicantCount ?? 0) === 1 ? '' : 's'}`
        }
        action={
          <Link to={`/opportunities/${opp.id}`} className="text-sm font-semibold text-fg hover:underline">
            View opportunity
          </Link>
        }
      />

      <PillTabs items={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} className="mb-6" />

      {isError ? (
        <ErrorState title="Couldn’t load applications" onRetry={refetch} />
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="No applications yet"
          description={statusFilter === 'all' ? 'Applications will show up here once people apply.' : `No ${statusFilter.toLowerCase()} applications.`}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} onView={setViewingApplication} />
          ))}
        </div>
      )}

      <ApplicationDetailModal application={viewingApplication} onClose={() => setViewingApplication(null)} />
    </div>
  )
}
