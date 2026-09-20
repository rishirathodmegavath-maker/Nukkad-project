import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Users, TrendingUp, Briefcase, Pencil, Check, X, UserPlus, Camera, Trash2, ChevronRight, MapPin, Globe, Lock, Sparkles, CalendarDays } from 'lucide-react'
import {
  getStartup,
  toggleFollowStartup,
  requestToJoinStartup,
  leaveStartup,
  getStartupMembers,
  getMyStartupMembership,
  getStartupJoinRequests,
  acceptStartupJoinRequest,
  rejectStartupJoinRequest,
  removeStartupTeamMember,
  updateStartupTeamMemberRole,
  uploadStartupLogo,
  removeStartupLogo,
  deleteStartup,
  getStartupUpdates,
  getStartupRoles,
} from '@/services/startups.service'
import { getFundraiseByStartup } from '@/services/investors.service'
import { listOpportunities } from '@/services/opportunities.service'
import { getCurrentUserId } from '@/services/users.service'
import { getEventsForStartup } from '@/services/events.service'
import { useUser } from '@/hooks/useUser'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import { Modal } from '@/components/ui/Modal'
import { UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { JoinStartupModal } from '@/components/domain/JoinStartupModal'
import { StartupEditModal } from '@/components/domain/StartupEditModal'
import { AddTeammateModal } from '@/components/domain/AddTeammateModal'
import { FundraiseCreateModal } from '@/components/domain/FundraiseCreateModal'
import { StartupMaterialsSection } from '@/components/domain/StartupMaterialsSection'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Opportunity, Startup, StartupMembershipStatus, StartupTeamRole } from '@/types'
import { ModerationBadge } from '@/components/domain/ModerationBadge'

const stageTone: Record<Startup['stage'], BadgeTone> = {
  Idea: 'neutral',
  MVP: 'info',
  'Early Traction': 'brand',
  Growth: 'success',
  Scaling: 'success',
}

const membershipStatusTone: Record<StartupMembershipStatus, BadgeTone> = {
  PENDING: 'info',
  ACTIVE: 'success',
  REJECTED: 'danger',
}

function TeamMemberRow({
  userId,
  role,
  teamRole,
  canRemove,
  onRemove,
  removing,
  canChangeRole,
  onChangeRole,
  changingRole,
}: {
  userId: string
  role: string
  teamRole: StartupTeamRole
  canRemove: boolean
  onRemove: () => void
  removing: boolean
  /** Only a founder can promote/demote — the target must not already be the founder. */
  canChangeRole: boolean
  onChangeRole: (newRole: 'ADMIN' | 'MEMBER') => void
  changingRole: boolean
}) {
  const { data: user } = useUser(userId)
  if (!user) return <Skeleton className="h-12 w-full rounded-lg" />
  return (
    <div className="flex items-center justify-between gap-2">
      <Link to={`/people/${user.id}`} className="flex items-center gap-2.5 min-w-0">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg truncate">{user.name}</p>
          <p className="text-xs text-fg-muted truncate">{role}</p>
        </div>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {canChangeRole && (
          <button
            type="button"
            disabled={changingRole}
            onClick={() => onChangeRole(teamRole === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
            title={teamRole === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
            className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-fg-secondary hover:bg-surface-hover hover:text-fg disabled:opacity-50 cursor-pointer"
          >
            {teamRole === 'ADMIN' ? 'Make Member' : 'Make Admin'}
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            disabled={removing}
            onClick={onRemove}
            title="Remove from team"
            className="rounded-md p-1 text-fg-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addTeammateModalOpen, setAddTeammateModalOpen] = useState(false)
  const [fundraiseModalOpen, setFundraiseModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPhase, setLogoPhase] = useState<UploadPhase>('idle')
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

  const { data: startup, isLoading, isError, refetch } = useQuery({
    queryKey: ['startup', id],
    queryFn: () => getStartup(id!),
    enabled: !!id,
  })

  const membersQuery = useQuery({
    queryKey: ['startup', id, 'members'],
    queryFn: () => getStartupMembers(id!),
    enabled: !!id,
  })

  const myMembershipQuery = useQuery({
    queryKey: ['startup', id, 'my-membership'],
    queryFn: () => getMyStartupMembership(id!),
    enabled: !!id,
  })

  // Derived from /my-membership (JWT-scoped server-side), not by cross-referencing the
  // separately-cached currentUser + members list — avoids a stale-currentUser-cache mismatch.
  const isFounder = myMembershipQuery.data?.isFounder ?? false
  // Founder or Admin — unlocks edit-startup/manage-team/post-jobs/edit-fundraising. Delete stays founder-only.
  const canManage = myMembershipQuery.data?.canManage ?? false

  const joinRequestsQuery = useQuery({
    queryKey: ['startup', id, 'join-requests'],
    queryFn: () => getStartupJoinRequests(id!),
    enabled: !!id && canManage,
  })

  const updatesQuery = useQuery({
    queryKey: ['startup', id, 'updates'],
    queryFn: () => getStartupUpdates(id!),
    enabled: !!id,
  })

  const rolesQuery = useQuery({
    queryKey: ['startup', id, 'roles'],
    queryFn: () => getStartupRoles(id!),
    enabled: !!id,
  })

  // Real, applyable opportunities attributed to this startup — the actual hiring system, unlike
  // the legacy `startup_roles` teaser above (kept only because JoinStartupModal's role picker
  // still reads it; nothing ever writes to it, so it never has anything to show here anyway).
  const opportunitiesQuery = useQuery({
    queryKey: ['startup', id, 'opportunities'],
    queryFn: () => listOpportunities({ startupId: id }),
    enabled: !!id,
  })

  // The public listing above only ever returns APPROVED postings — to everyone, the poster included —
  // so on its own it tells a founder "No open positions" while their own role is still waiting for
  // review. The API lets a poster see their own unreviewed postings when the query is filtered to
  // postedByUserId=self, so a manager also asks for those and the two lists are merged below. Public
  // visitors never make this request, and the moderation rules are untouched.
  const myUserId = getCurrentUserId()
  const ownOpportunitiesQuery = useQuery({
    queryKey: ['startup', id, 'opportunities', 'mine'],
    queryFn: () => listOpportunities({ startupId: id, postedByUserId: myUserId }),
    enabled: !!id && canManage && !!myUserId,
  })
  const openPositions = useMemo(() => {
    const byId = new Map<string, Opportunity>()
    for (const opp of opportunitiesQuery.data ?? []) byId.set(opp.id, opp)
    for (const opp of ownOpportunitiesQuery.data ?? []) {
      // A rejected posting is not an open position (it has its own "Not approved" state under
      // Posted by Me); closed and admin-removed ones are already excluded by the API.
      if (opp.moderationStatus === 'REJECTED') continue
      byId.set(opp.id, opp)
    }
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [opportunitiesQuery.data, ownOpportunitiesQuery.data])

  const { data: fundraise } = useQuery({
    queryKey: ['fundraise', 'by-startup', id],
    queryFn: () => getFundraiseByStartup(id!),
    enabled: !!id && !!startup?.isRaising,
  })

  const eventsQuery = useQuery({
    queryKey: ['startup', id, 'events'],
    queryFn: () => getEventsForStartup(id!),
    enabled: !!id,
  })

  const invalidateStartup = () => {
    queryClient.invalidateQueries({ queryKey: ['startup', id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => uploadStartupLogo(id!, file),
    onSuccess: () => {
      invalidateStartup()
      setLogoPhase('done')
      setTimeout(() => setLogoPhase('idle'), 1200)
      toast.success('Logo updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setLogoPhase('idle')
    },
  })

  const removeLogoMutation = useMutation({
    mutationFn: () => removeStartupLogo(id!),
    onSuccess: () => {
      invalidateStartup()
      toast.success('Logo removed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove logo'),
  })

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingLogoFile(file)
    e.target.value = ''
  }

  const followMutation = useMutation({
    mutationFn: () => toggleFollowStartup(id!),
    onSuccess: (updated) => {
      invalidateStartup()
      toast.success(updated.isFollowing ? `Following ${updated.name}` : 'Unfollowed')
    },
  })

  const quickJoinMutation = useMutation({
    mutationFn: (roleId?: string) => requestToJoinStartup(id!, roleId),
    onSuccess: () => {
      invalidateStartup()
      toast.success('Request sent to join the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send request'),
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveStartup(id!),
    onSuccess: () => {
      invalidateStartup()
      toast.info('You left the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not leave the team'),
  })

  const acceptMutation = useMutation({
    mutationFn: (memberId: string) => acceptStartupJoinRequest(memberId),
    onSuccess: () => {
      invalidateStartup()
      toast.success('Added to the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not accept request'),
  })

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => rejectStartupJoinRequest(memberId),
    onSuccess: () => {
      invalidateStartup()
      toast.info('Request declined')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not decline request'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeStartupTeamMember(id!, userId),
    onSuccess: () => {
      invalidateStartup()
      toast.info('Removed from the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove teammate'),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, teamRole }: { userId: string; teamRole: 'ADMIN' | 'MEMBER' }) =>
      updateStartupTeamMemberRole(id!, userId, teamRole),
    onSuccess: (member) => {
      invalidateStartup()
      toast.success(member.teamRole === 'ADMIN' ? 'Promoted to Admin' : 'Moved back to Member')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update this teammate's role"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteStartup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.info('Startup deleted')
      navigate('/startups')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this startup')
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

  if (isError || !startup) {
    return <ErrorState title="Couldn’t load this startup" onRetry={refetch} />
  }

  const isFollowing = !!startup.isFollowing
  const myMembership = myMembershipQuery.data
  const isActiveMember = myMembership?.status === 'ACTIVE'
  const isPending = myMembership?.status === 'PENDING'
  const isRejected = myMembership?.status === 'REJECTED'
  const pendingRequests = joinRequestsQuery.data ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/startups" className="hover:text-fg transition-colors">
          Startups
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{startup.name}</span>
      </div>

      {canManage && startup.moderationStatus === 'PENDING' && (
        <Card className="border border-warning-500/30 bg-warning-500/5 flex items-center gap-3">
          <Badge tone="warning">Pending review</Badge>
          <p className="text-sm text-fg-secondary">
            This startup is waiting on admin approval and isn't visible to anyone else yet.
          </p>
        </Card>
      )}
      {canManage && startup.moderationStatus === 'REJECTED' && (
        <Card className="border border-danger-500/30 bg-danger-500/5 flex items-center gap-3">
          <Badge tone="danger">Not approved</Badge>
          <p className="text-sm text-fg-secondary">{startup.rejectionReason ?? 'This startup was not approved.'}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col sm:flex-row sm:items-start gap-5">
          {canManage ? (
            <div className="relative shrink-0 size-20">
              <DropdownMenu
                trigger={
                  <button className="relative size-full rounded-full cursor-pointer group" aria-label="Logo options">
                    <Avatar src={startup.logoUrl} name={startup.name} size="xl" />
                    <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="size-4" />
                    </span>
                    <UploadSpinnerOverlay phase={logoPhase} />
                  </button>
                }
              >
                <DropdownItem icon={<Camera className="size-4" />} onClick={() => logoInputRef.current?.click()}>
                  {startup.logoUrl ? 'Change logo' : 'Add logo'}
                </DropdownItem>
                {startup.logoUrl && (
                  <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => removeLogoMutation.mutate()}>
                    Remove logo
                  </DropdownItem>
                )}
              </DropdownMenu>
            </div>
          ) : (
            <Avatar src={startup.logoUrl} name={startup.name} size="xl" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-fg">{startup.name}</h1>
                  {startup.isRaising && <Badge tone="accent">Raising</Badge>}
                  {startup.visibility === 'Nukkad Members' && (
                    <Badge tone="neutral" className="flex items-center gap-1">
                      <Lock className="size-3" /> Members only
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-fg-muted mt-0.5">{startup.tagline}</p>
                {(startup.location || startup.website) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-fg-muted">
                    {startup.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {startup.location}
                      </span>
                    )}
                    {startup.website && (
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-fg hover:underline"
                      >
                        <Globe className="size-3" /> {startup.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManage && (
                  <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditModalOpen(true)}>
                    Edit
                  </Button>
                )}
                {isFounder && (
                  <Button
                    variant="danger-subtle"
                    size="sm"
                    leftIcon={<Trash2 className="size-3.5" />}
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Heart className="size-3.5" />}
                  isLoading={followMutation.isPending}
                  onClick={() => followMutation.mutate()}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                {!isFounder && !isActiveMember && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    isLoading={quickJoinMutation.isPending}
                    onClick={() => setJoinModalOpen(true)}
                  >
                    {isPending ? 'Request sent' : isRejected ? 'Request again' : 'Join startup'}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge tone={stageTone[startup.stage]}>{startup.stage}</Badge>
              <Badge tone="neutral">{startup.sector}</Badge>
            </div>
          </div>
        </Card>

        {canManage && pendingRequests.length > 0 && (
          <Card>
            <h2 className="font-semibold text-fg mb-3 flex items-center gap-2">
              <Users className="size-4" /> Join requests ({pendingRequests.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border border-border-subtle rounded-lg p-3">
                  <Link to={`/people/${request.applicant.id}`} className="flex items-center gap-2.5 min-w-0 group">
                    <Avatar src={request.applicant.avatarUrl} name={request.applicant.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-fg group-hover:underline transition-colors truncate">
                        {request.applicant.name}
                      </p>
                      <p className="text-xs text-fg-muted truncate">{request.applicant.headline}</p>
                    </div>
                  </Link>
                  {request.roleTitle && (
                    <div className="mt-2.5">
                      <Badge tone="brand">{request.roleTitle}</Badge>
                    </div>
                  )}
                  {request.message && <p className="text-sm text-fg-muted mt-2">“{request.message}”</p>}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
                    <Button
                      size="sm"
                      variant="danger-subtle"
                      leftIcon={<X className="size-3.5" />}
                      isLoading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(request.id)}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Check className="size-3.5" />}
                      isLoading={acceptMutation.isPending}
                      onClick={() => acceptMutation.mutate(request.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {canManage && startup.profileCompletionPercent < 100 && (
          <Card className="flex items-center justify-between gap-3 border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center size-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 shrink-0">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">Your profile is {startup.profileCompletionPercent}% complete</p>
                <p className="text-xs text-fg-muted">Add more details so founders, investors and teammates get the full picture.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setEditModalOpen(true)} className="shrink-0">
              Complete profile
            </Button>
          </Card>
        )}

        {(startup.problem || startup.solution) && (
          <Card>
            <div className="grid sm:grid-cols-2 gap-5">
              {startup.problem && (
                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1">Problem</p>
                  <p className="text-sm text-fg-secondary leading-relaxed">{startup.problem}</p>
                </div>
              )}
              {startup.solution && (
                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1">Solution</p>
                  <p className="text-sm text-fg-secondary leading-relaxed">{startup.solution}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {(startup.targetCustomer || startup.businessModel || startup.whatBuilding) && (
          <Card>
            <h2 className="font-semibold text-fg mb-3">Startup details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {startup.targetCustomer && (
                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1">Target customer</p>
                  <p className="text-sm text-fg-secondary leading-relaxed">{startup.targetCustomer}</p>
                </div>
              )}
              {startup.businessModel && (
                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1">Business model</p>
                  <p className="text-sm text-fg-secondary leading-relaxed">{startup.businessModel}</p>
                </div>
              )}
              {startup.whatBuilding && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1">What we're building</p>
                  <p className="text-sm text-fg-secondary leading-relaxed">{startup.whatBuilding}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {(startup.revenue || startup.customers || startup.users || startup.growth || startup.otherTraction) && (
          <Card>
            <h2 className="font-semibold text-fg mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-success-500" /> Traction
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {startup.revenue && (
                <div className="rounded-lg border border-border-subtle p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">Revenue</p>
                  <p className="text-sm font-semibold text-fg truncate">{startup.revenue}</p>
                </div>
              )}
              {startup.customers && (
                <div className="rounded-lg border border-border-subtle p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">Customers</p>
                  <p className="text-sm font-semibold text-fg truncate">{startup.customers}</p>
                </div>
              )}
              {startup.users && (
                <div className="rounded-lg border border-border-subtle p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">Users</p>
                  <p className="text-sm font-semibold text-fg truncate">{startup.users}</p>
                </div>
              )}
              {startup.growth && (
                <div className="rounded-lg border border-border-subtle p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">Growth</p>
                  <p className="text-sm font-semibold text-fg truncate">{startup.growth}</p>
                </div>
              )}
            </div>
            {startup.otherTraction && <p className="text-sm text-fg-secondary leading-relaxed">{startup.otherTraction}</p>}
          </Card>
        )}

        <Card>
          <h2 className="font-semibold text-fg mb-3">Updates</h2>
          {updatesQuery.data && updatesQuery.data.length > 0 ? (
            <div className="flex flex-col gap-4">
              {updatesQuery.data.map((update) => (
                <div key={update.id} className="border-l-2 border-brand-200 pl-3.5">
                  <p className="text-sm text-fg-secondary">{update.content}</p>
                  <p className="text-xs text-fg-muted mt-1">{formatRelativeTime(update.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">No updates posted yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-fg mb-3 flex items-center gap-2">
            <Briefcase className="size-4" /> Open Positions
          </h2>
          {opportunitiesQuery.isLoading || ownOpportunitiesQuery.isLoading ? (
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : openPositions.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {openPositions.map((opp) => {
                // Only a manager's own role can be unreviewed here; the poster can't apply to it.
                const isOwnPosting = opp.postedByUserId === myUserId
                return (
                  <div key={opp.id} className="flex items-center justify-between gap-3 border border-border-subtle rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-fg truncate">{opp.title}</p>
                        <ModerationBadge status={opp.moderationStatus} />
                      </div>
                      <p className="text-xs text-fg-muted mt-0.5 truncate">
                        {opp.type} {opp.location && `· ${opp.location}`} · {opp.workMode}
                      </p>
                      {opp.moderationStatus === 'PENDING' && (
                        <p className="text-xs text-fg-muted mt-0.5">Only you can see this until an admin approves it.</p>
                      )}
                    </div>
                    <Link to={`/opportunities/${opp.id}`} className="shrink-0">
                      <Button size="sm" variant="secondary">
                        {isOwnPosting ? 'View' : 'Apply Now'}
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : canManage ? (
            <EmptyState
              title="No open positions yet"
              description="Post an opportunity to start hiring through this startup."
              action={
                <Link to={`/opportunities/new?startupId=${id}`}>
                  <Button size="sm">Post an opportunity</Button>
                </Link>
              }
            />
          ) : (
            <EmptyState title="No open positions right now" description="Follow this startup to hear when they’re hiring." />
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        {!isFounder && myMembership && (
          <Card>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center">
                <Badge tone={membershipStatusTone[myMembership.status]}>
                  {myMembership.status === 'ACTIVE' ? 'On the team' : myMembership.status === 'PENDING' ? 'Request sent' : 'Not selected'}
                </Badge>
              </div>
              {isActiveMember && (
                <Button
                  variant="outline"
                  className="w-full"
                  isLoading={leaveMutation.isPending}
                  onClick={() => leaveMutation.mutate()}
                >
                  Leave team
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-fg flex items-center gap-2">
              <Users className="size-4" /> Team
            </h2>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTeammateModalOpen(true)}
                title="Add a teammate"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <UserPlus className="size-3.5" /> Add
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {(membersQuery.data ?? []).map((member) => (
              <TeamMemberRow
                key={member.userId}
                userId={member.userId}
                role={member.role}
                teamRole={member.teamRole}
                canRemove={canManage && !member.isFounder && (isFounder || !member.isAdmin)}
                removing={removeMemberMutation.isPending && removeMemberMutation.variables === member.userId}
                onRemove={() => removeMemberMutation.mutate(member.userId)}
                canChangeRole={isFounder && !member.isFounder}
                changingRole={changeRoleMutation.isPending && changeRoleMutation.variables?.userId === member.userId}
                onChangeRole={(newRole) => changeRoleMutation.mutate({ userId: member.userId, teamRole: newRole })}
              />
            ))}
          </div>
        </Card>

        {startup.needs.length > 0 && (
          <Card>
            <h2 className="font-semibold text-fg mb-3">What they need</h2>
            <div className="flex flex-wrap gap-1.5">
              {startup.needs.map((need) => (
                <Badge key={need} tone="neutral">
                  {need}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <StartupMaterialsSection startupId={startup.id} canManage={canManage} />

        {eventsQuery.data && eventsQuery.data.length > 0 && (
          <Card>
            <h2 className="font-semibold text-fg mb-3 flex items-center gap-2">
              <CalendarDays className="size-4" /> Events
            </h2>
            <div className="flex flex-col gap-2.5">
              {eventsQuery.data.map((evt) => (
                <Link
                  key={evt.id}
                  to={`/events/${evt.id}`}
                  className="flex items-center justify-between gap-3 border border-border-subtle rounded-lg p-3 hover:border-border-strong transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{evt.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5 truncate">
                      {new Date(evt.startAt).toLocaleDateString()} {evt.location && `· ${evt.location}`} {evt.isOnline && '· Online'}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-fg-muted shrink-0" />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {startup.isRaising && fundraise && (
          <Card>
            <h2 className="font-semibold text-fg mb-1">Fundraising</h2>
            <p className="text-sm text-fg-muted mb-3">{fundraise.fundingStage}</p>
            <div className="h-2 rounded-full bg-surface-sunken overflow-hidden mb-2">
              <div
                className="h-full bg-brand-500"
                style={{ width: `${Math.min(100, (fundraise.amountRaised / fundraise.targetAmount) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-fg-secondary">
              {formatCurrency(fundraise.amountRaised)} of {formatCurrency(fundraise.targetAmount)} raised
            </p>
            <Link to={`/investors/fundraises/${fundraise.id}`}>
              <Button size="sm" variant="secondary" className="w-full mt-3">
                View fundraise details
              </Button>
            </Link>
            {canManage && (
              <Link to="/investors">
                <Button size="sm" className="w-full mt-2">
                  Find Investors
                </Button>
              </Link>
            )}
          </Card>
        )}

        {canManage && !startup.isRaising && (
          <Card>
            <h2 className="font-semibold text-fg mb-1">Fundraising</h2>
            <p className="text-sm text-fg-muted mb-3">Not currently raising. Starting a fundraise makes this startup discoverable to investors.</p>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => setFundraiseModalOpen(true)}>
              Start a fundraise
            </Button>
          </Card>
        )}
      </div>
    </div>

    <JoinStartupModal
      startupId={startup.id}
      startupName={startup.name}
      roles={rolesQuery.data ?? []}
      open={joinModalOpen}
      onClose={() => setJoinModalOpen(false)}
    />
      {canManage && <StartupEditModal open={editModalOpen} onClose={() => setEditModalOpen(false)} startup={startup} />}
      {canManage && (
        <AddTeammateModal
          startupId={startup.id}
          startupName={startup.name}
          existingMemberIds={(membersQuery.data ?? []).map((m) => m.userId)}
          canGrantAdmin={isFounder}
          open={addTeammateModalOpen}
          onClose={() => setAddTeammateModalOpen(false)}
        />
      )}

      {canManage && !startup.isRaising && (
        <FundraiseCreateModal
          open={fundraiseModalOpen}
          onClose={() => setFundraiseModalOpen(false)}
          startupId={startup.id}
          startupStage={startup.stage}
        />
      )}

      {canManage && (
        <>
          <input
            ref={logoInputRef}
            type="file"
            id="startup-logo-upload"
            name="startup-logo-upload"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleLogoChange}
          />
          <ImageCropModal
            file={pendingLogoFile}
            aspect={1}
            shape="circle"
            title="Crop logo"
            outputWidth={640}
            onCancel={() => setPendingLogoFile(null)}
            onConfirm={(cropped) => {
              setPendingLogoFile(null)
              setLogoPhase('uploading')
              uploadLogoMutation.mutate(cropped)
            }}
          />
        </>
      )}

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this startup?"
        description={`"${startup.name}" will be permanently removed, along with its team, updates, and open roles. This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete startup
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Are you sure you want to permanently delete this startup?</p>
      </Modal>
    </div>
  )
}
