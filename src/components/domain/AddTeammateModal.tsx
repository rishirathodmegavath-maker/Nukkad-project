import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { listUsers } from '@/services/users.service'
import { addStartupTeamMember } from '@/services/startups.service'
import { toast } from '@/store/toast.store'
import type { StartupTeamRole } from '@/types'

interface AddTeammateModalProps {
  startupId: string
  startupName: string
  existingMemberIds: string[]
  /** Only a founder can grant the Admin tier at add-time — an admin adding a teammate can only add them as a Member. */
  canGrantAdmin: boolean
  open: boolean
  onClose: () => void
}

export function AddTeammateModal({ startupId, startupName, existingMemberIds, canGrantAdmin, open, onClose }: AddTeammateModalProps) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [teamRole, setTeamRole] = useState<StartupTeamRole>('MEMBER')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => listUsers({ query: query.trim() || undefined }),
    enabled: open,
  })

  const candidates = useMemo(
    () => (users ?? []).filter((u) => !existingMemberIds.includes(u.id)),
    [users, existingMemberIds],
  )

  const addMutation = useMutation({
    mutationFn: (userId: string) => addStartupTeamMember(startupId, userId, undefined, canGrantAdmin ? teamRole : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', startupId] })
      toast.success('Added to the team')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add teammate'),
  })

  if (!open) return null

  return (
    <Modal open onClose={onClose} title="Add a teammate" description={`Directly add someone to “${startupName}”.`} size="md">
      <div className="flex flex-col gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name…"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500 focus:shadow-focus"
          autoFocus
        />

        {canGrantAdmin && (
          <Select label="Add as" value={teamRole} onChange={(e) => setTeamRole(e.target.value as StartupTeamRole)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        )}

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
          ) : candidates.length > 0 ? (
            candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{u.name}</p>
                    <p className="text-xs text-fg-muted truncate">{u.headline}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={addMutation.isPending && addMutation.variables === u.id}
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate(u.id)}
                >
                  Add
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-fg-muted text-center py-4">
              {query ? 'No one matches that search.' : 'Start typing a name to find someone to add.'}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
