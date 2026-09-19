import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link2, Mail, MessageCircle, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { listUsers } from '@/services/users.service'
import { getOrCreateConversationWith, sendMessage } from '@/services/messages.service'
import { toast } from '@/store/toast.store'
import type { Post, User } from '@/types'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  post: Post
}

function ConnectionTile({
  user,
  selected,
  sent,
  disabled,
  onToggle,
}: {
  user: User
  selected: boolean
  sent: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      disabled={sent || disabled}
      className="flex flex-col items-center gap-1.5 cursor-pointer disabled:cursor-default rounded-lg p-1 -m-1 transition-colors hover:bg-surface-hover disabled:hover:bg-transparent"
    >
      <span className="relative">
        <Avatar src={user.avatarUrl} name={user.name} size="lg" className={selected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface rounded-full' : ''} />
        {(selected || sent) && (
          <span
            className={
              'absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface ' +
              (sent ? 'bg-success-500 text-white' : 'bg-brand-500 text-white')
            }
          >
            <Check className="size-3" />
          </span>
        )}
      </span>
      <span className="text-xs text-fg truncate max-w-[72px]">{sent ? 'Sent' : user.name}</span>
    </button>
  )
}

export function ShareModal({ open, onClose, post }: ShareModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'connections-for-share'],
    queryFn: () => listUsers(),
    enabled: open,
  })

  const connections = useMemo(() => {
    const connected = (users ?? []).filter((u) => u.connectionStatus === 'CONNECTED')
    if (!query.trim()) return connected
    const q = query.trim().toLowerCase()
    return connected.filter((u) => u.name.toLowerCase().includes(q))
  }, [users, query])

  const shareUrl = `${window.location.origin}/feed/${post.id}`
  const shareSnippet = post.content ? post.content.slice(0, 140) : 'Check out this post on Buildadda'
  const shareText = `${shareSnippet}\n${shareUrl}`

  function toggleSelected(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const sendMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds)
      await Promise.all(
        ids.map(async (userId) => {
          const conversation = await getOrCreateConversationWith(userId)
          await sendMessage(conversation.id, '', post.id)
        }),
      )
      return ids
    },
    onSuccess: (ids) => {
      setSentIds((prev) => new Set([...prev, ...ids]))
      setSelectedIds(new Set())
      toast.success(ids.length > 1 ? `Sent to ${ids.length} people` : 'Sent')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send'),
  })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy link')
    }
  }

  function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Modal open={open} onClose={onClose} title="Share" size="md">
      <div className="flex flex-col gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search connections…"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500 focus:shadow-focus"
        />

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : connections.length > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto py-1">
              {connections.map((u) => (
                <ConnectionTile
                  key={u.id}
                  user={u}
                  selected={selectedIds.has(u.id)}
                  sent={sentIds.has(u.id)}
                  disabled={sendMutation.isPending}
                  onToggle={() => toggleSelected(u.id)}
                />
              ))}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="w-full rounded-lg bg-brand-500 text-fg-on-brand text-sm font-semibold py-2.5 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60 cursor-pointer"
              >
                {sendMutation.isPending
                  ? 'Sending…'
                  : `Send${selectedIds.size > 1 ? ` to ${selectedIds.size} people` : ''}`}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-fg-muted text-center py-4">
            {query ? 'No connections match that search.' : 'Connect with people to share posts with them directly.'}
          </p>
        )}

        <div className="flex items-center gap-6 overflow-x-auto border-t border-border-subtle pt-4 -mx-5 px-5">
          <button onClick={copyLink} className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-fg transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">
              <Link2 className="size-[18px]" />
            </span>
            <span className="text-[11px] text-fg-secondary">Copy Link</span>
          </button>
          <button
            onClick={() => openExternal(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)}
            className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-[#0A66C2] text-white text-sm font-bold transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">in</span>
            <span className="text-[11px] text-fg-secondary">LinkedIn</span>
          </button>
          <button onClick={() => openExternal(`https://wa.me/?text=${encodeURIComponent(shareText)}`)} className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#25D366] text-white transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">
              <MessageCircle className="size-[18px]" />
            </span>
            <span className="text-[11px] text-fg-secondary">WhatsApp</span>
          </button>
          <button
            onClick={() => openExternal(`mailto:?subject=${encodeURIComponent('Check this out on Buildadda')}&body=${encodeURIComponent(shareText)}`)}
            className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-fg transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">
              <Mail className="size-[18px]" />
            </span>
            <span className="text-[11px] text-fg-secondary">Email</span>
          </button>
          <button
            onClick={() => openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
            className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-[#1877F2] text-white text-sm font-bold transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">f</span>
            <span className="text-[11px] text-fg-secondary">Facebook</span>
          </button>
          <button
            onClick={() => openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareSnippet)}&url=${encodeURIComponent(shareUrl)}`)}
            className="group flex shrink-0 flex-col items-center gap-1.5 cursor-pointer"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-black text-white text-sm font-bold transition-all duration-150 group-hover:scale-110 group-hover:shadow-md group-active:scale-100">X</span>
            <span className="text-[11px] text-fg-secondary">X</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
