import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MailPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { acceptStartupInvitation, declineStartupInvitation } from '@/services/startups.service'
import { toast } from '@/store/toast.store'
import type { Startup, StartupTeamMember } from '@/types'

/**
 * A founder or admin invited this person to the team. Nothing about the team applies to them (no roster listing, no
 * access, no messaging permission) until they accept here, so nobody can be put on a team without agreeing to it.
 */
export function StartupInvitationBanner({ startup, membership }: { startup: Startup; membership: StartupTeamMember }) {
  const queryClient = useQueryClient()

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }

  const accept = useMutation({
    mutationFn: () => acceptStartupInvitation(startup.id),
    onSuccess: refresh,
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not accept the invitation'),
  })
  const decline = useMutation({
    mutationFn: () => declineStartupInvitation(startup.id),
    onSuccess: refresh,
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not decline the invitation'),
  })
  const busy = accept.isPending || decline.isPending
  const asAdmin = membership.teamRole === 'ADMIN'

  return (
    <Card className="flex flex-col gap-4 border border-brand-500/25 bg-brand-500/[0.05] sm:flex-row sm:items-center sm:justify-between" data-testid="team-invitation">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600" aria-hidden="true">
          <MailPlus className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg [overflow-wrap:anywhere]">You’re invited to join {startup.name}</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            {asAdmin ? 'As an Admin, you’d help run the startup and manage its team. ' : 'As a member of its team. '}
            You only join if you accept.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" isLoading={decline.isPending} disabled={busy} onClick={() => decline.mutate()}>
          Decline
        </Button>
        <Button isLoading={accept.isPending} disabled={busy} onClick={() => accept.mutate()}>
          Accept invitation
        </Button>
      </div>
    </Card>
  )
}
