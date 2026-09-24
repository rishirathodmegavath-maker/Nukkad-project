import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Briefcase, IndianRupee, Users, MessageSquare, ListChecks, ChevronRight, Lock, LockOpen, Pencil, Trash2, PieChart, GraduationCap, CalendarClock } from 'lucide-react'
import { getOpportunity, expressInterestInOpportunity, withdrawApplication, closeOpportunity, reopenOpportunity, deleteOpportunity } from '@/services/opportunities.service'
import { getStartup } from '@/services/startups.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ApplyToOpportunityModal } from '@/components/domain/ApplyToOpportunityModal'
import { ConnectAction } from '@/components/domain/ConnectAction'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { ApplicationStatus, Startup } from '@/types'

const CTA_LABEL: Record<string, string> = {
  'Full-time': 'Apply',
  Internship: 'Apply',
  'Founding Role': "I'm Interested",
  'Co-founder': "I'm Interested",
  'Startup Project': 'Apply',
  'AI/ML Role': 'Apply',
  Campus: 'Join the Team',
}

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  Pending: 'info',
  Shortlisted: 'brand',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
}

// Matches StartupCard's stage color convention, kept local since it's a small presentational map.
const STARTUP_STAGE_TONE: Record<Startup['stage'], BadgeTone> = {
  Idea: 'neutral',
  MVP: 'info',
  'Early Traction': 'brand',
  Growth: 'success',
  Scaling: 'success',
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: opp, isLoading, isError, refetch } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunity(id!),
    enabled: !!id,
  })

  const { data: poster } = useUser(opp?.postedByUserId)
  const { data: currentUser } = useCurrentUser()

  const { data: startup } = useQuery({
    queryKey: ['startup', opp?.startupId],
    queryFn: () => getStartup(opp!.startupId!),
    enabled: !!opp?.startupId,
  })
  const startupPitch = startup?.tagline?.trim() || startup?.problem?.trim() || startup?.solution?.trim() || undefined

  const usesInterest = opp && ['Founding Role', 'Co-founder', 'Campus'].includes(opp.type)
  const isOwner = !!currentUser && !!opp && opp.postedByUserId === currentUser.id

  const interestMutation = useMutation({
    mutationFn: () => expressInterestInOpportunity(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
      // applicantCount/interestCount shown on OpportunityCard (home, list, chapter tab, posted-by-me)
      // reads from this separate plural query — without it those views go stale after this action.
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('You’re on the list — the poster has been notified.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not express interest'),
  })

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawApplication(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not withdraw application'),
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(poster!.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  })

  const closeMutation = useMutation({
    mutationFn: () => closeOpportunity(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['opportunity', id], updated)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not close this opportunity'),
  })

  const reopenMutation = useMutation({
    mutationFn: () => reopenOpportunity(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['opportunity', id], updated)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not reopen this opportunity'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteOpportunity(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.info('Opportunity deleted')
      navigate('/opportunities')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this opportunity')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !opp) {
    return <ErrorState title="Couldn’t load this opportunity" onRetry={refetch} />
  }

  const hasActed = usesInterest ? !!opp.hasExpressedInterest : !!opp.hasApplied
  const applicationStatus = opp.applicationStatus
  const canWithdraw = applicationStatus === 'Pending' || applicationStatus === 'Shortlisted'

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/opportunities" className="hover:text-fg transition-colors">
          Opportunities
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{opp.title}</span>
      </div>

      {isOwner && opp.moderationStatus === 'PENDING' && (
        <Card className="border border-warning-500/30 bg-warning-500/5 flex items-center gap-3">
          <Badge tone="warning">Pending review</Badge>
          <p className="text-sm text-fg-secondary">
            This posting is waiting on admin approval and isn't visible to anyone else yet.
          </p>
        </Card>
      )}
      {isOwner && opp.moderationStatus === 'REJECTED' && (
        <Card className="border border-danger-500/30 bg-danger-500/5 flex items-center gap-3">
          <Badge tone="danger">Not approved</Badge>
          <p className="text-sm text-fg-secondary">{opp.rejectionReason ?? 'This posting was not approved.'}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-xl border border-border/80 shadow-xs bg-surface p-6 sm:p-7">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{opp.type}</Badge>
                {opp.closed && <Badge tone="danger">🔒 Applications closed</Badge>}
              </div>
              <span className="text-xs text-fg-muted font-medium">{formatRelativeTime(opp.createdAt)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight leading-tight">{opp.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-fg-muted">
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5" /> {opp.organizationName}
            </span>
            {(opp.location || opp.workMode) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {opp.location}
                {opp.location && opp.workMode && ' · '}
                {opp.workMode}
              </span>
            )}
            {opp.compensation && (
              <span className="flex items-center gap-1.5">
                <IndianRupee className="size-3.5" /> {opp.compensation}
              </span>
            )}
            {opp.equity && (
              <span className="flex items-center gap-1.5">
                <PieChart className="size-3.5" /> {opp.equity} equity
              </span>
            )}
            {opp.experienceLevel && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5" /> {opp.experienceLevel}
              </span>
            )}
            {opp.applicationDeadline && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" /> Apply by {new Date(opp.applicationDeadline).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-border-subtle">
            <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-fg-secondary leading-relaxed">{opp.description}</p>
          </div>

          {opp.responsibilities && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Responsibilities</p>
              <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">{opp.responsibilities}</p>
            </div>
          )}

          {opp.requirements.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Requirements</p>
              <ul className="list-disc list-inside text-sm text-fg-secondary space-y-1">
                {opp.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {opp.requiredSkills.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {opp.requiredSkills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          {isOwner ? (
            <div className="flex flex-col gap-2">
              {!usesInterest && (
                <Link to={`/opportunities/${opp.id}/applications`}>
                  <Button className="w-full" leftIcon={<ListChecks className="size-4" />}>
                    View applications
                  </Button>
                </Link>
              )}
              <Link to={`/opportunities/${opp.id}/edit`}>
                <Button className="w-full" variant="secondary" leftIcon={<Pencil className="size-4" />}>
                  Edit
                </Button>
              </Link>
              {opp.closed ? (
                <Button
                  className="w-full"
                  variant="outline"
                  leftIcon={<LockOpen className="size-4" />}
                  isLoading={reopenMutation.isPending}
                  onClick={() => reopenMutation.mutate()}
                >
                  Reopen opportunity
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="danger-subtle"
                  leftIcon={<Lock className="size-4" />}
                  isLoading={closeMutation.isPending}
                  onClick={() => closeMutation.mutate()}
                >
                  Close opportunity
                </Button>
              )}
              <Button
                className="w-full"
                variant="danger-subtle"
                leftIcon={<Trash2 className="size-4" />}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          ) : usesInterest ? (
            <Button
              className="w-full"
              disabled={hasActed || opp.closed}
              isLoading={interestMutation.isPending}
              onClick={() => interestMutation.mutate()}
            >
              {opp.closed ? 'Closed' : hasActed ? 'Sent' : CTA_LABEL[opp.type]}
            </Button>
          ) : applicationStatus ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center">
                <Badge tone={STATUS_TONE[applicationStatus]}>{applicationStatus}</Badge>
              </div>
              {applicationStatus === 'Accepted' && poster && (
                <Button
                  className="w-full"
                  leftIcon={<MessageSquare className="size-3.5" />}
                  isLoading={messageMutation.isPending}
                  onClick={() => messageMutation.mutate()}
                >
                  Message {poster.name.split(' ')[0]}
                </Button>
              )}
              {canWithdraw && (
                <Button
                  variant="outline"
                  className="w-full"
                  isLoading={withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  Withdraw application
                </Button>
              )}
            </div>
          ) : (
            <Button className="w-full" disabled={opp.closed} onClick={() => setApplyModalOpen(true)}>
              {opp.closed ? 'Applications closed' : CTA_LABEL[opp.type]}
            </Button>
          )}
          <p className="text-xs text-fg-muted text-center mt-3 flex items-center justify-center gap-1.5">
            <Users className="size-3.5" />
            {usesInterest ? (opp.interestCount ?? 0) : (opp.applicantCount ?? 0)}{' '}
            {usesInterest ? 'interested' : 'applicants'}
          </p>
        </Card>

        {poster && (
          <Card>
            <h2 className="font-semibold text-fg mb-3">Posted by</h2>
            <div className="flex items-center justify-between gap-2.5">
              <Link to={`/people/${poster.id}`} className="flex items-center gap-2.5 min-w-0">
                <Avatar src={poster.avatarUrl} name={poster.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{poster.name}</p>
                  <p className="text-xs text-fg-muted truncate">{poster.headline}</p>
                </div>
              </Link>
              <div className="shrink-0">
                <ConnectAction user={poster} />
              </div>
            </div>
          </Card>
        )}

        {opp.startupId && startup && (
          <Card>
            <h2 className="font-semibold text-fg mb-3">About the startup</h2>
            <Link to={`/startups/${startup.id}`} className="flex items-center gap-2.5 min-w-0">
              <Avatar src={startup.logoUrl} name={startup.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-fg truncate">{startup.name}</p>
                  {startup.isRaising && (
                    <Badge tone="accent" dot size="sm" className="shrink-0">
                      Raising
                    </Badge>
                  )}
                </div>
                {startup.location && <p className="text-xs text-fg-muted truncate">{startup.location}</p>}
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <Badge tone={STARTUP_STAGE_TONE[startup.stage] ?? 'neutral'} size="sm">
                {startup.stage}
              </Badge>
              {startup.sector && (
                <Badge tone="neutral" size="sm">
                  {startup.sector}
                </Badge>
              )}
            </div>

            {startupPitch && <p className="text-sm text-fg-secondary leading-relaxed line-clamp-2 mt-2.5">{startupPitch}</p>}

            <Link to={`/startups/${startup.id}`}>
              <Button variant="secondary" className="w-full mt-3">
                View startup profile
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>

    <ApplyToOpportunityModal
      opportunityId={opp.id}
      opportunityTitle={opp.title}
      open={applyModalOpen}
      onClose={() => setApplyModalOpen(false)}
    />

    <Modal
      open={confirmDeleteOpen}
      onClose={() => setConfirmDeleteOpen(false)}
      title="Delete this opportunity?"
      description={`"${opp.title}" will be permanently removed, along with its applications and interest history. This action cannot be undone.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete opportunity
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">Are you sure you want to permanently delete this opportunity?</p>
    </Modal>
  </div>
)
}
