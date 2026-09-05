import { useState, type ReactNode } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Sparkles, ArrowRight, Check, X, Star, ChevronRight, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { getOrCreateConversationWith } from '@/services/messages.service'
import {
  getIdea,
  getIdeaMembers,
  addToTeam,
  removeFromTeam,
  turnIntoStartup,
  getIdeaMatch,
  withdrawInterest,
  shortlistInterest,
  rejectInterest,
  deleteIdea,
} from '@/services/ideas.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUser } from '@/hooks/useUser'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ExpressInterestModal } from '@/components/domain/ExpressInterestModal'
import { IdeaEditModal } from '@/components/domain/IdeaEditModal'
import { MatchReasons } from '@/components/domain/MatchReasons'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Idea, IdeaInterestStatus } from '@/types'

const stageTone: Record<Idea['stage'], BadgeTone> = {
  Concept: 'neutral',
  Validating: 'info',
  Building: 'brand',
  Launched: 'success',
}

const interestStatusTone: Record<IdeaInterestStatus, BadgeTone> = {
  Pending: 'info',
  Shortlisted: 'brand',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
}

function PersonRow({ userId, right }: { userId: string; right?: ReactNode }) {
  const { data: user } = useUser(userId)
  if (!user) return <Skeleton className="h-12 w-full rounded-lg" />
  return (
    <div className="flex items-center justify-between gap-3">
      <Link to={`/people/${user.id}`} className="flex items-center gap-2.5 min-w-0">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg truncate">{user.name}</p>
          <p className="text-xs text-fg-muted truncate">{user.headline}</p>
        </div>
      </Link>
      {right}
    </div>
  )
}

function IdeaMatchCard({ ideaId }: { ideaId: string }) {
  const { data: match } = useQuery({
    queryKey: ['idea', ideaId, 'match'],
    queryFn: () => getIdeaMatch(ideaId),
  })

  if (!match || match.reasons.length === 0) return null

  return (
    <Card>
      <h2 className="font-semibold text-fg mb-1">You may be a good fit for this idea</h2>
      <p className="text-sm text-fg-secondary font-medium mb-2">{match.matchLabel}</p>
      <MatchReasons reasons={match.reasons} />
    </Card>
  )
}

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { data: currentUser } = useCurrentUser()

  const { data: idea, isLoading, isError, refetch } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!),
    enabled: !!id,
  })

  const { data: creator } = useUser(idea?.creatorId)

  const { data: members } = useQuery({
    queryKey: ['idea', id, 'members'],
    queryFn: () => getIdeaMembers(id!),
    enabled: !!id,
  })

  const invalidateIdea = () => {
    queryClient.invalidateQueries({ queryKey: ['idea', id] })
    queryClient.invalidateQueries({ queryKey: ['idea', id, 'members'] })
    // Interest/team-size counts shown on IdeaCard (home, ideas list, chapter tab, profile) all read
    // from this separate plural query — without it they go stale after any team action here.
    queryClient.invalidateQueries({ queryKey: ['ideas'] })
  }

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(creator!.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: () => toast.error('Could not start conversation'),
  })

  const addToTeamMutation = useMutation({
    mutationFn: (userId: string) => addToTeam(id!, userId),
    onSuccess: () => {
      invalidateIdea()
      toast.success('Added to the team')
    },
  })

  const shortlistMutation = useMutation({
    mutationFn: (interestId: string) => shortlistInterest(interestId),
    onSuccess: () => {
      invalidateIdea()
      toast.success('Shortlisted')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (interestId: string) => rejectInterest(interestId),
    onSuccess: () => {
      invalidateIdea()
      toast.info('Interest declined')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawInterest(id!),
    onSuccess: () => {
      invalidateIdea()
      toast.info('Interest withdrawn')
    },
  })

  const leaveTeamMutation = useMutation({
    mutationFn: () => removeFromTeam(id!, currentUser!.id),
    onSuccess: () => {
      invalidateIdea()
      toast.info('You left the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not leave the team'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeFromTeam(id!, userId),
    onSuccess: () => {
      invalidateIdea()
      toast.info('Removed from the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove teammate'),
  })

  const turnIntoStartupMutation = useMutation({
    mutationFn: () => turnIntoStartup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
      toast.success('Nice — “' + idea?.title + '” is on its way to becoming a startup.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteIdea(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.info('Idea deleted')
      navigate('/ideas')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this idea')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !idea) {
    return <ErrorState title="Couldn’t load this idea" onRetry={refetch} />
  }

  const isCreator = !!currentUser && idea.creatorId === currentUser.id
  const isOnTeam = !!currentUser && idea.teamUserIds.includes(currentUser.id)
  const interests = members?.interests ?? []
  const pendingReview = interests.filter((i) => i.status === 'Pending' || i.status === 'Shortlisted')
  const myInterest = currentUser ? interests.find((i) => i.applicant.id === currentUser.id) : undefined
  const canReapply = !myInterest || myInterest.status === 'Withdrawn'
  const canWithdraw = myInterest?.status === 'Pending' || myInterest?.status === 'Shortlisted'

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/ideas" className="hover:text-fg transition-colors">
          Ideas
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{idea.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge tone={stageTone[idea.stage]}>{idea.stage}</Badge>
              <Badge tone="neutral">{idea.category}</Badge>
              <span className="text-xs text-fg-muted ml-auto">{formatRelativeTime(idea.createdAt)}</span>
              {isCreator && (
                <>
                  <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                  {!idea.startupId && (
                    <Button
                      variant="danger-subtle"
                      size="sm"
                      leftIcon={<Trash2 className="size-3.5" />}
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight leading-tight mb-4">{idea.title}</h1>

            <div className="grid sm:grid-cols-3 gap-4 mt-5 p-4 rounded-xl bg-surface-sunken/60 border border-border/70">
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-1">Problem</p>
                <p className="text-sm text-fg leading-relaxed">{idea.problem}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-1">Solution</p>
                <p className="text-sm text-fg leading-relaxed">{idea.solution}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-1">Target customer</p>
                <p className="text-sm text-fg leading-relaxed">{idea.targetCustomer}</p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border/60">
              <p className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Help needed</p>
              <div className="flex flex-wrap gap-1.5">
                {idea.helpNeeded.map((area) => (
                  <Badge key={area} tone="neutral">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {isCreator && pendingReview.length > 0 && (
            <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface">
              <h2 className="font-bold text-base text-fg mb-3 flex items-center gap-2">
                <Users className="size-4" /> Interested builders ({pendingReview.length})
              </h2>
              <div className="flex flex-col gap-3">
                {pendingReview.map((interest) => (
                  <div key={interest.id} className="border border-border/80 rounded-xl p-3.5 bg-surface-sunken/40">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/people/${interest.applicant.id}`} className="flex items-center gap-2.5 min-w-0 group">
                        <Avatar src={interest.applicant.avatarUrl} name={interest.applicant.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-fg group-hover:underline transition-colors truncate">
                            {interest.applicant.name}
                          </p>
                          <p className="text-xs text-fg-muted truncate">{interest.applicant.headline}</p>
                        </div>
                      </Link>
                      <Badge tone={interestStatusTone[interest.status]} className="shrink-0">
                        {interest.status}
                      </Badge>
                    </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {interest.contributionAreas.map((area) => (
                      <Badge key={area} tone="brand">{area}</Badge>
                    ))}
                  </div>
                  {interest.message && <p className="text-sm text-fg-muted mt-2">“{interest.message}”</p>}

                  {interest.relevantSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {interest.relevantSkills.slice(0, 6).map((skill) => (
                        <Badge key={skill} tone="neutral">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {interest.relevantExperience.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2.5 text-xs text-fg-muted">
                      {interest.relevantExperience.map((exp) => (
                        <span key={exp.id}>
                          {exp.role} · {exp.company}
                        </span>
                      ))}
                    </div>
                  )}

                  {interest.relevantProjects.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1 text-xs text-fg-muted">
                      {interest.relevantProjects.map((project) => (
                        <span key={project.id}>{project.title}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
                    {interest.status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Star className="size-3.5" />}
                        isLoading={shortlistMutation.isPending}
                        onClick={() => shortlistMutation.mutate(interest.id)}
                      >
                        Shortlist
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger-subtle"
                      leftIcon={<X className="size-3.5" />}
                      isLoading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(interest.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Check className="size-3.5" />}
                      isLoading={addToTeamMutation.isPending}
                      onClick={() => addToTeamMutation.mutate(interest.applicant.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {!isCreator && !isOnTeam && <IdeaMatchCard ideaId={idea.id} />}

        <Card>
          {isCreator ? (
            idea.startupId ? (
              <Button variant="secondary" className="w-full" disabled>
                Already a startup
              </Button>
            ) : (
              <Button
                className="w-full"
                leftIcon={<Sparkles className="size-4" />}
                isLoading={turnIntoStartupMutation.isPending}
                onClick={() => turnIntoStartupMutation.mutate()}
              >
                Turn into startup
              </Button>
            )
          ) : isOnTeam ? (
            <div className="flex flex-col gap-3">
              <Button variant="secondary" className="w-full" disabled>
                You’re on the team
              </Button>
              <Button
                variant="outline"
                className="w-full"
                isLoading={leaveTeamMutation.isPending}
                onClick={() => leaveTeamMutation.mutate()}
              >
                Leave team
              </Button>
            </div>
          ) : myInterest && !canReapply ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center">
                <Badge tone={interestStatusTone[myInterest.status]}>{myInterest.status}</Badge>
              </div>
              {canWithdraw && (
                <Button
                  variant="outline"
                  className="w-full"
                  isLoading={withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  Withdraw interest
                </Button>
              )}
            </div>
          ) : (
            <Button className="w-full" rightIcon={<ArrowRight className="size-4" />} onClick={() => setModalOpen(true)}>
              I want to build this
            </Button>
          )}
          <p className="text-xs text-fg-muted text-center mt-3">
            {idea.interestCount ?? interests.length} interested · {idea.teamUserIds.length} on the team
          </p>
        </Card>

        {creator && !isCreator && (
          <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface flex flex-col gap-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-fg-muted">Pitched by</h2>
            <Link to={`/people/${creator.id}`} className="flex items-center gap-3 group">
              <Avatar src={creator.avatarUrl} name={creator.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg group-hover:underline truncate">{creator.name}</p>
                <p className="text-xs text-fg-muted truncate">{creator.headline || creator.role || 'Idea Creator'}</p>
                {creator.location && <p className="text-[11px] text-fg-muted truncate mt-0.5">{creator.location}</p>}
              </div>
            </Link>

            {currentUser && currentUser.id !== creator.id && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<MessageSquare className="size-3.5" />}
                isLoading={messageMutation.isPending}
                onClick={() => messageMutation.mutate()}
                className="w-full mt-1"
              >
                Message Creator
              </Button>
            )}
          </Card>
        )}

        <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface">
          <h2 className="font-bold text-base text-fg mb-3">Team ({idea.teamUserIds.length})</h2>
          <div className="flex flex-col gap-3">
            {idea.teamUserIds.map((userId) => (
              <PersonRow
                key={userId}
                userId={userId}
                right={
                  isCreator && userId !== idea.creatorId ? (
                    <button
                      type="button"
                      disabled={removeMemberMutation.isPending && removeMemberMutation.variables === userId}
                      onClick={() => removeMemberMutation.mutate(userId)}
                      title="Remove from team"
                      className="shrink-0 rounded-md p-1 text-fg-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        </Card>
      </div>
    </div>

    <ExpressInterestModal
      ideaId={idea.id}
      ideaTitle={idea.title}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
    />
    <IdeaEditModal open={editOpen} onClose={() => setEditOpen(false)} idea={idea} />

    <Modal
      open={confirmDeleteOpen}
      onClose={() => setConfirmDeleteOpen(false)}
      title="Delete this idea?"
      description={`"${idea.title}" will be permanently removed, along with its team and interest history. This action cannot be undone.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete idea
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">Are you sure you want to permanently delete this idea?</p>
    </Modal>
  </div>
)
}
