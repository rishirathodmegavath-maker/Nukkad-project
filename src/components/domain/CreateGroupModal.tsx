import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Check, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { listUserConnections, getCurrentUserId } from '@/services/users.service'
import { createGroup } from '@/services/messages.service'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

interface CreateGroupModalProps {
  open: boolean
  onClose: () => void
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const myId = getCurrentUserId() ?? ''
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: connections, isLoading } = useQuery({
    queryKey: ['user-connections', myId],
    queryFn: () => listUserConnections(myId),
    enabled: open && !!myId,
  })

  const filtered = useMemo(() => {
    if (!connections) return []
    if (!searchQuery.trim()) return connections
    const q = searchQuery.toLowerCase().trim()
    return connections.filter((c) => c.name.toLowerCase().includes(q))
  }, [connections, searchQuery])

  const createMutation = useMutation({
    mutationFn: () => createGroup(name.trim(), [...selectedIds]),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Group created')
      reset()
      onClose()
      navigate(`/messages/${conversation.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create group'),
  })

  function reset() {
    setName('')
    setSearchQuery('')
    setSelectedIds(new Set())
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleClose() {
    reset()
    onClose()
  }

  const canCreate = name.trim().length > 0 && selectedIds.size > 0

  return (
    <Modal open={open} onClose={handleClose} title="New group" size="md">
      <div className="flex flex-col gap-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" maxLength={100} />

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
          <input
            id="create-group-search"
            name="create-group-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your connections…"
            className="w-full rounded-lg border border-border/80 bg-surface pl-10 pr-3 py-2 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
          />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto pr-0.5">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-fg-muted text-center py-6">
              {searchQuery ? `No connections matching "${searchQuery}"` : 'Connect with people first to start a group.'}
            </p>
          ) : (
            filtered.map((user) => {
              const selected = selectedIds.has(user.id)
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggle(user.id)}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border text-left cursor-pointer transition-all',
                    selected ? 'border-brand-500 bg-brand-500/5' : 'border-border/70 hover:border-border-strong hover:bg-surface-hover/50',
                  )}
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg truncate">{user.name}</p>
                    <p className="text-xs text-fg-muted truncate">{user.headline || user.role || 'Community Member'}</p>
                  </div>
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-border-strong',
                    )}
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/70">
          <p className="text-xs text-fg-muted flex items-center gap-1.5">
            <Users className="size-3.5" /> {selectedIds.size} selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!canCreate} isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create group
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
