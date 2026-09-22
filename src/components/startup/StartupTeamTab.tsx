import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, UserPlus, Users, X } from 'lucide-react'
import {
  acceptStartupJoinRequest,
  leaveStartup,
  rejectStartupJoinRequest,
  removeStartupTeamMember,
  updateStartupTeamMemberRole,
} from '@/services/startups.service'
import { useUser } from '@/hooks/useUser'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { AddTeammateModal } from '@/components/domain/AddTeammateModal'
import { toast } from '@/store/toast.store'
import type { Startup, StartupJoinRequest, StartupTeamMember, StartupTeamRole } from '@/types'

const ROLE_LABEL: Record<StartupTeamRole, string> = { FOUNDER: 'Founder', ADMIN: 'Admin', MEMBER: 'Member' }
const ROLE_TONE: Record<StartupTeamRole, BadgeTone> = { FOUNDER: 'primary', ADMIN: 'info', MEMBER: 'neutral' }
const ROLE_ORDER: Record<StartupTeamRole, number> = { FOUNDER: 0, ADMIN: 1, MEMBER: 2 }

interface TeamMemberCardProps {
  member: StartupTeamMember
  canRemove: boolean
  onRemove: () => void
  removing: boolean
  /** Only a founder can promote or demote, and never the founder themselves. */
  canChangeRole: boolean
  onChangeRole: (role: 'ADMIN' | 'MEMBER') => void
  changingRole: boolean
}

function TeamMemberCard({ member, canRemove, onRemove, removing, canChangeRole, onChangeRole, changingRole }: TeamMemberCardProps) {
  // The team list already carries who each person is; only a row that came without one is looked up.
  const lookup = useUser(member.user ? undefined : member.userId)
  const user = member.user ?? lookup.data
  const isError = lookup.isError
  if (!user && !isError) return <Skeleton className="h-[88px] w-full rounded-xl" />

  const name = user?.name ?? 'BuildAdda member'
  return (
    <Card padding="sm" className="flex min-w-0 flex-col gap-3 shadow-2xs" data-testid="team-member">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar src={user?.avatarUrl} name={name} size="md" />
        <div className="min-w-0 flex-1">
          {user ? (
            <Link to={`/people/${user.id}`} className="block truncate text-sm font-semibold text-fg hover:underline">
              {name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-fg">{name}</p>
          )}
          {/* The title a member holds (e.g. CTO); a plain "Founder"/"Admin"/"Member" is already the badge below. */}
          {member.role.trim() && member.role.trim().toLowerCase() !== ROLE_LABEL[member.teamRole].toLowerCase() && (
            <p className="mt-0.5 truncate text-xs text-fg-muted">{member.role}</p>
          )}
          <div className="mt-1.5">
            <Badge tone={ROLE_TONE[member.teamRole]}>{ROLE_LABEL[member.teamRole]}</Badge>
          </div>
        </div>
      </div>
      {(canChangeRole || canRemove) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          {canChangeRole && (
            <Button
              size="sm"
              variant="secondary"
              isLoading={changingRole}
              onClick={() => onChangeRole(member.teamRole === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
            >
              {member.teamRole === 'ADMIN' ? 'Make Member' : 'Make Admin'}
            </Button>
          )}
          {canRemove && (
            <Button size="sm" variant="danger-subtle" leftIcon={<X className="size-3.5" />} isLoading={removing} onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function JoinRequestCard({ request, onAccept, onReject, busy }: { request: StartupJoinRequest; onAccept: () => void; onReject: () => void; busy: boolean }) {
  return (
    <Card padding="sm" variant="sunken" className="flex min-w-0 flex-col gap-2.5">
      <Link to={`/people/${request.applicant.id}`} className="group flex min-w-0 items-center gap-3">
        <Avatar src={request.applicant.avatarUrl} name={request.applicant.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg group-hover:underline">{request.applicant.name}</p>
          {request.applicant.headline && <p className="truncate text-xs text-fg-muted">{request.applicant.headline}</p>}
        </div>
      </Link>
      {request.roleTitle && (
        <div>
          <Badge tone="primary">{request.roleTitle}</Badge>
        </div>
      )}
      {request.message && <p className="text-sm text-fg-secondary [overflow-wrap:anywhere]">“{request.message}”</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
        <Button size="sm" leftIcon={<Check className="size-3.5" />} isLoading={busy} onClick={onAccept}>
          Accept
        </Button>
        <Button size="sm" variant="danger-subtle" leftIcon={<X className="size-3.5" />} disabled={busy} onClick={onReject}>
          Decline
        </Button>
      </div>
    </Card>
  )
}

/** Asks before someone is taken off the team, naming them; they lose their part in the startup straight away. */
function RemoveMemberModal({ member, startupName, busy, onCancel, onConfirm }: {
  member: StartupTeamMember | null
  startupName: string
  busy: boolean
  onCancel: () => void
  onConfirm: (userId: string) => void
}) {
  const lookup = useUser(member?.user ? undefined : member?.userId)
  const name = (member?.user ?? lookup.data)?.name ?? 'this person'
  return (
    <Modal
      open={!!member}
      onClose={busy ? () => undefined : onCancel}
      title={`Remove ${name}?`}
      description={`${name} will no longer be part of ${startupName}${member?.teamRole === 'ADMIN' ? ' and will lose their admin access' : ''}. They can ask to join again later.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={busy} onClick={() => member && onConfirm(member.userId)}>
            Remove from team
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">Their updates and messages stay where they are.</p>
    </Modal>
  )
}

interface StartupTeamTabProps {
  startup: Startup
  members?: StartupTeamMember[]
  membersLoading: boolean
  canManage: boolean
  isFounder: boolean
  /** The viewer's own membership, if any. */
  membership?: StartupTeamMember
  pendingRequests: StartupJoinRequest[]
}

/**
 * The people behind the startup. Adding, removing, promoting and accepting are the existing team actions, unchanged;
 * the server decides who may do them, and this only offers the buttons to people it will allow.
 */
export function StartupTeamTab({ startup, members, membersLoading, canManage, isFounder, membership, pendingRequests }: StartupTeamTabProps) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StartupTeamMember | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }
  const fail = (fallback: string) => (err: unknown) => toast.error(err instanceof Error ? err.message : fallback)

  const accept = useMutation({
    mutationFn: (memberId: string) => acceptStartupJoinRequest(memberId),
    onSuccess: () => {
      refresh()
      toast.success('Added to the team')
    },
    onError: fail('Could not accept request'),
  })
  const reject = useMutation({
    mutationFn: (memberId: string) => rejectStartupJoinRequest(memberId),
    onSuccess: () => {
      refresh()
      toast.info('Request declined')
    },
    onError: fail('Could not decline request'),
  })
  const remove = useMutation({
    mutationFn: (userId: string) => removeStartupTeamMember(startup.id, userId),
    onSuccess: () => {
      refresh()
      setRemoveTarget(null)
      toast.info('Removed from the team')
    },
    onError: (err) => {
      setRemoveTarget(null)
      fail('Could not remove teammate')(err)
    },
  })
  const changeRole = useMutation({
    mutationFn: ({ userId, teamRole }: { userId: string; teamRole: 'ADMIN' | 'MEMBER' }) => updateStartupTeamMemberRole(startup.id, userId, teamRole),
    onSuccess: (member) => {
      refresh()
      toast.success(member.teamRole === 'ADMIN' ? 'Promoted to Admin' : 'Moved back to Member')
    },
    onError: fail("Could not update this teammate's role"),
  })
  const leave = useMutation({
    mutationFn: () => leaveStartup(startup.id),
    onSuccess: () => {
      refresh()
      setConfirmLeave(false)
      toast.info('You left the team')
    },
    onError: (err) => {
      setConfirmLeave(false)
      toast.error(err instanceof Error ? err.message : 'Could not leave the team')
    },
  })

  const sorted = [...(members ?? [])].sort((a, b) => ROLE_ORDER[a.teamRole] - ROLE_ORDER[b.teamRole])
  const isActiveMember = membership?.status === 'ACTIVE'

  return (
    <div className="flex flex-col gap-4">
      {canManage && pendingRequests.length > 0 && (
        <SectionCard title={`Join requests (${pendingRequests.length})`} description="People asking to join this startup." icon={<Users className="size-4" />}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pendingRequests.map((request) => (
              <JoinRequestCard
                key={request.id}
                request={request}
                busy={(accept.isPending && accept.variables === request.id) || (reject.isPending && reject.variables === request.id)}
                onAccept={() => accept.mutate(request.id)}
                onReject={() => reject.mutate(request.id)}
              />
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Team"
        description={members ? `${members.length} ${members.length === 1 ? 'person' : 'people'} building ${startup.name}` : undefined}
        icon={<Users className="size-4" />}
        action={
          canManage ? (
            <Button size="sm" variant="secondary" leftIcon={<UserPlus className="size-3.5" />} onClick={() => setAddOpen(true)}>
              Add teammate
            </Button>
          ) : undefined
        }
      >
        {membersLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-[88px] w-full rounded-xl" />
            <Skeleton className="h-[88px] w-full rounded-xl" />
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((member) => (
              <TeamMemberCard
                key={member.userId}
                member={member}
                canRemove={canManage && !member.isFounder && (isFounder || !member.isAdmin)}
                removing={remove.isPending && remove.variables === member.userId}
                onRemove={() => setRemoveTarget(member)}
                canChangeRole={isFounder && !member.isFounder}
                changingRole={changeRole.isPending && changeRole.variables?.userId === member.userId}
                onChangeRole={(teamRole) => changeRole.mutate({ userId: member.userId, teamRole })}
              />
            ))}
          </div>
        ) : (
          <EmptyState as="h3" className="py-10" icon={<Users className="size-5" />} title="No team members listed yet" />
        )}
      </SectionCard>

      {membership && !membership.isFounder && (
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Badge tone={isActiveMember ? 'success' : membership.status === 'PENDING' ? 'info' : 'danger'}>
              {isActiveMember ? 'On the team' : membership.status === 'PENDING' ? 'Request sent' : 'Not selected'}
            </Badge>
            <p className="text-sm text-fg-muted [overflow-wrap:anywhere]">
              {isActiveMember ? `You’re part of ${startup.name}.` : membership.status === 'PENDING' ? 'The founders will review your request.' : 'Your request wasn’t accepted.'}
            </p>
          </div>
          {isActiveMember && (
            <Button size="sm" variant="secondary" onClick={() => setConfirmLeave(true)}>
              Leave team
            </Button>
          )}
        </Card>
      )}

      {canManage && (
        <AddTeammateModal
          startupId={startup.id}
          startupName={startup.name}
          existingMemberIds={(members ?? []).map((m) => m.userId)}
          canGrantAdmin={isFounder}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      )}

      <RemoveMemberModal
        member={removeTarget}
        startupName={startup.name}
        busy={remove.isPending}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={(userId) => remove.mutate(userId)}
      />

      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this team?"
        description={`You’ll no longer be listed as part of ${startup.name}. You can ask to join again later.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={leave.isPending} onClick={() => leave.mutate()}>
              Leave team
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Are you sure you want to leave?</p>
      </Modal>
    </div>
  )
}
