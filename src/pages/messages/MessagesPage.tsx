import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Send,
  MessageSquare,
  Info,
  X,
  Bell,
  UserX,
  Flag,
  Trash2,
  ImageOff,
  ArrowLeft,
  MoreHorizontal,
  CheckSquare,
  Check,
  Reply,
  Users,
  UserPlus,
  LogOut,
  Crown,
  Pencil,
  Undo2,
  Play,
} from 'lucide-react'
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useHideMessagesForMe,
  useEditMessage,
  useUnsendMessage,
} from '@/hooks/useConversations'
import { useUser } from '@/hooks/useUser'
import { useSwipeToReply } from '@/hooks/useSwipeToReply'
import { getCurrentUserId } from '@/services/users.service'
import * as usersService from '@/services/users.service'
import * as messagesService from '@/services/messages.service'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { PillTabs } from '@/components/ui/Tabs'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReportModal } from '@/components/domain/ReportModal'
import { CreateGroupModal } from '@/components/domain/CreateGroupModal'
import { toast } from '@/store/toast.store'
import { cn, formatRelativeTime, formatDateTime, formatSeenTime, pluralize } from '@/lib/utils'
import type { Conversation, Message, User } from '@/types'

function groupDisplayName(conversation: Conversation): string {
  return conversation.group?.name || 'Group'
}

function GroupAvatar({ conversation, size = 'md' }: { conversation: Conversation; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'size-9' : 'size-10'
  return conversation.group?.avatarUrl ? (
    <img src={conversation.group.avatarUrl} alt="" className={cn(dim, 'rounded-full object-cover shrink-0')} />
  ) : (
    <span className={cn(dim, 'shrink-0 rounded-full bg-surface-sunken border border-border flex items-center justify-center text-fg-muted')}>
      <Users className="size-4" />
    </span>
  )
}

function SharedPostPreview({ message, conversationId }: { message: Message; conversationId: string }) {
  const post = message.sharedPost
  const { data: author } = useUser(post?.authorId)
  const image = post?.attachments.find((a) => a.kind === 'image')
  const video = !image ? post?.attachments.find((a) => a.kind === 'video') : undefined

  if (!post) {
    return (
      <div className="flex items-center gap-2 w-64 max-w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 text-fg-muted">
        <ImageOff className="size-4 shrink-0" />
        <span className="text-xs">This post is no longer available</span>
      </div>
    )
  }

  return (
    <Link
      to={`/feed/${post.id}`}
      state={{ from: `/messages/${conversationId}`, fromLabel: 'Back to chat' }}
      className="block w-64 max-w-full overflow-hidden rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover transition-colors"
    >
      {image && <img src={image.url} alt="" className="h-40 w-full object-cover" />}
      {video && (
        // No `controls`/click-to-play here — the whole card is a Link to the real post, matching
        // the feed's own player; this is just a poster-style preview with a play affordance.
        <div className="relative h-40 w-full bg-black">
          <video src={video.url} muted playsInline preload="metadata" className="size-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-xs">
              <Play className="size-4 text-white fill-white ml-0.5" />
            </span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <Avatar src={author?.avatarUrl} name={author?.name ?? ''} size="xs" />
        <span className="text-xs font-semibold text-fg truncate">{author?.name}</span>
      </div>
      <p className="px-3 pb-3 pt-1 text-xs text-fg-secondary line-clamp-3">{post.content}</p>
    </Link>
  )
}

function ConversationListItem({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const navigate = useNavigate()
  const isGroup = conversation.type === 'GROUP'
  const otherUserId = conversation.participantIds.find((p) => p !== getCurrentUserId())
  const { data: user } = useUser(isGroup ? undefined : otherUserId)
  if (!isGroup && !user) return <Skeleton className="h-16 w-full rounded-xl" />

  const lastMessage = conversation.lastMessage
  const unread = conversation.unreadCount > 0
  const title = isGroup ? groupDisplayName(conversation) : conversation.nickname || user!.name

  return (
    <button
      onClick={() => navigate(`/messages/${conversation.id}`)}
      className={cn(
        'flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-xl border cursor-pointer transition-all',
        active
          ? 'bg-surface-selected border-border-strong shadow-2xs'
          : 'border-border/70 hover:border-border-strong hover:bg-surface-hover hover:shadow-2xs',
      )}
    >
      {isGroup ? <GroupAvatar conversation={conversation} /> : <Avatar src={user!.avatarUrl} name={user!.name} size="md" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm truncate', unread ? 'font-semibold text-fg' : 'font-medium text-fg')}>{title}</p>
          {lastMessage && <span className="text-xs text-fg-muted shrink-0">{formatRelativeTime(lastMessage.createdAt)}</span>}
        </div>
        <p className={cn('text-xs truncate mt-0.5', unread ? 'text-fg font-medium' : 'text-fg-muted')}>
          {lastMessage
            ? lastMessage.type === 'SHARED_POST'
              ? lastMessage.content
                ? `Shared a post · ${lastMessage.content}`
                : 'Shared a post'
              : lastMessage.content
            : 'Say hello'}
        </p>
      </div>
      {unread && <span className="size-2 rounded-full bg-brand-500 shrink-0" />}
    </button>
  )
}

interface MessageGroup {
  senderId: string
  messages: Message[]
}

function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  const GAP_MS = 60_000
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    const lastMsg = last?.messages[last.messages.length - 1]
    if (last && last.senderId === msg.senderId && lastMsg && +new Date(msg.createdAt) - +new Date(lastMsg.createdAt) < GAP_MS) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.senderId, messages: [msg] })
    }
  }
  return groups
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-brand-500' : 'bg-surface-sunken border border-border')}>
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </span>
  )
}

function DetailsPanel({
  conversation,
  otherUser,
  onClose,
}: {
  conversation: Conversation
  otherUser?: User
  onClose: () => void
}) {
  if (conversation.type === 'GROUP') {
    return <GroupDetailsPanel conversation={conversation} onClose={onClose} />
  }
  return <DirectDetailsPanel conversation={conversation} otherUser={otherUser!} onClose={onClose} />
}

function DirectDetailsPanel({
  conversation,
  otherUser,
  onClose,
}: {
  conversation: Conversation
  otherUser: User
  onClose: () => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [nicknameDraft, setNicknameDraft] = useState(conversation.nickname ?? '')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const muteMutation = useMutation({
    mutationFn: () => messagesService.toggleMuteConversation(conversation.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success(updated.muted ? 'Messages muted' : 'Messages unmuted')
    },
  })

  const nicknameMutation = useMutation({
    mutationFn: () => messagesService.setConversationNickname(conversation.id, nicknameDraft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Nickname saved')
    },
  })

  const blockMutation = useMutation({
    mutationFn: () => usersService.blockUser(otherUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowBlockModal(false)
      toast.success(`Blocked ${otherUser.name}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => messagesService.deleteConversation(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setShowDeleteModal(false)
      navigate('/messages', { replace: true })
      toast.success('Chat deleted')
    },
  })

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Details Container: Slide-over drawer on mobile/tablet, docked right column on desktop (lg:static) */}
      <div className="fixed inset-y-0 right-0 z-50 w-[300px] max-w-[85vw] bg-surface border-l border-border/80 shadow-2xl flex flex-col overflow-y-auto lg:static lg:z-auto lg:w-[280px] lg:shadow-none lg:border-border-subtle animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
          <p className="font-semibold text-fg text-sm">Details</p>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>

      <button
        onClick={() => muteMutation.mutate()}
        disabled={muteMutation.isPending}
        className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle hover:bg-surface-hover cursor-pointer disabled:opacity-50"
      >
        <span className="flex items-center gap-2.5 text-sm text-fg">
          <Bell className="size-4" /> Mute messages
        </span>
        <ToggleSwitch on={conversation.muted} />
      </button>

      <div className="px-4 py-3.5 border-b border-border-subtle">
        <p className="text-xs font-semibold text-fg-muted mb-2.5">Members</p>
        <Link to={`/people/${otherUser.id}`} className="flex items-center gap-2.5 hover:opacity-80">
          <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="sm" />
          <span className="text-sm text-fg">{otherUser.name}</span>
        </Link>
      </div>

      <div className="px-4 py-3.5 border-b border-border-subtle flex flex-col gap-2">
        <p className="text-xs font-semibold text-fg-muted">Nickname</p>
        <div className="flex gap-2">
          <input
            value={nicknameDraft}
            onChange={(e) => setNicknameDraft(e.target.value)}
            placeholder={otherUser.name}
            className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <Button size="sm" variant="secondary" isLoading={nicknameMutation.isPending} onClick={() => nicknameMutation.mutate()}>
            Save
          </Button>
        </div>
      </div>

      <button
        onClick={() => setShowBlockModal(true)}
        className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border-subtle text-sm text-fg hover:bg-surface-hover cursor-pointer text-left"
      >
        <UserX className="size-4" /> Block
      </button>
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border-subtle text-sm text-danger-500 hover:bg-surface-hover cursor-pointer text-left"
      >
        <Flag className="size-4" /> Report
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-danger-500 hover:bg-surface-hover cursor-pointer text-left"
      >
        <Trash2 className="size-4" /> Delete chat
      </button>

      <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 border border-danger-200/60 dark:border-danger-800/40 shrink-0">
              <UserX className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Block {otherUser.name}?</h3>
              <p className="text-xs text-fg-muted mt-0.5">They won't be able to message you.</p>
            </div>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">
            They won't be able to message you or find your profile. They will not be notified that you blocked them.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button variant="secondary" size="sm" onClick={() => setShowBlockModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={blockMutation.isPending}
              onClick={() => blockMutation.mutate()}
            >
              Block user
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 border border-danger-200/60 dark:border-danger-800/40 shrink-0">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Delete chat from inbox?</h3>
              <p className="text-xs text-fg-muted mt-0.5">Clears history for your account.</p>
            </div>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">
            This removes the chat from your inbox and erases your chat history. {otherUser.name} keeps their own copy.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Delete chat
            </Button>
          </div>
        </div>
      </Modal>

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={otherUser.id}
        conversationId={conversation.id}
      />
    </div>
  </>
)
}

function GroupMemberRow({ conversation, userId, role }: { conversation: Conversation; userId: string; role: string }) {
  const { data: user } = useUser(userId)
  const queryClient = useQueryClient()
  const myId = getCurrentUserId()
  const isMe = userId === myId
  const iAmAdmin = conversation.group?.myRole === 'ADMIN'

  const roleMutation = useMutation({
    mutationFn: (newRole: 'ADMIN' | 'MEMBER') => messagesService.updateGroupRole(conversation.id, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Role updated')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update role'),
  })

  const removeMutation = useMutation({
    mutationFn: () => messagesService.removeGroupMember(conversation.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success(user ? `Removed ${user.name}` : 'Member removed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove member'),
  })

  if (!user) return <Skeleton className="h-10 w-full rounded-lg" />

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Link to={`/people/${user.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <span className="text-sm text-fg truncate">
          {user.name}
          {isMe && ' (You)'}
        </span>
        {role === 'ADMIN' && <Crown className="size-3.5 text-amber-500 shrink-0" />}
      </Link>
      {iAmAdmin && !isMe && (
        <DropdownMenu
          align="right"
          trigger={
            <button className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors">
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          <DropdownItem onClick={() => roleMutation.mutate(role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>
            {role === 'ADMIN' ? 'Remove as admin' : 'Make admin'}
          </DropdownItem>
          <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => removeMutation.mutate()}>
            Remove from group
          </DropdownItem>
        </DropdownMenu>
      )}
    </div>
  )
}

function AddGroupMembersModal({ conversation, open, onClose }: { conversation: Conversation; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const myId = getCurrentUserId() ?? ''
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: connections, isLoading } = useQuery({
    queryKey: ['user-connections', myId],
    queryFn: () => usersService.listUserConnections(myId),
    enabled: open,
  })

  const candidates = (connections ?? []).filter((c) => !conversation.participantIds.includes(c.id))

  const addMutation = useMutation({
    mutationFn: () => messagesService.addGroupMembers(conversation.id, [...selectedIds]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Members added')
      setSelectedIds(new Set())
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add members'),
  })

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Add members" size="sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto">
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : candidates.length === 0 ? (
            <p className="text-sm text-fg-muted text-center py-4">Everyone in your connections is already in this group.</p>
          ) : (
            candidates.map((user) => {
              const selected = selectedIds.has(user.id)
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggle(user.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-all',
                    selected ? 'border-brand-500 bg-brand-500/5' : 'border-border/70 hover:border-border-strong',
                  )}
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                  <span className="text-sm text-fg truncate flex-1">{user.name}</span>
                  {selected && <Check className="size-4 text-brand-600 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={selectedIds.size === 0} isLoading={addMutation.isPending} onClick={() => addMutation.mutate()}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function GroupDetailsPanel({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const group = conversation.group!
  const iAmAdmin = group.myRole === 'ADMIN'
  const [nameDraft, setNameDraft] = useState(group.name)
  const [editingName, setEditingName] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const renameMutation = useMutation({
    mutationFn: () => messagesService.renameGroup(conversation.id, nameDraft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setEditingName(false)
      toast.success('Group renamed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not rename group'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => messagesService.setGroupAvatar(conversation.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Group photo updated')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update group photo'),
  })

  const leaveMutation = useMutation({
    mutationFn: () => messagesService.leaveGroup(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate('/messages', { replace: true })
      toast.success('Left group')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not leave group'),
  })

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 z-50 w-[300px] max-w-[85vw] bg-surface border-l border-border/80 shadow-2xl flex flex-col overflow-y-auto lg:static lg:z-auto lg:w-[280px] lg:shadow-none lg:border-border-subtle animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
          <p className="font-semibold text-fg text-sm">Group info</p>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2.5 px-4 py-5 border-b border-border-subtle">
          <button
            type="button"
            onClick={() => iAmAdmin && avatarInputRef.current?.click()}
            className={cn('relative', iAmAdmin && 'cursor-pointer group')}
            disabled={!iAmAdmin}
          >
            <GroupAvatar conversation={conversation} />
            {iAmAdmin && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="size-3.5 text-white" />
              </span>
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) avatarMutation.mutate(file)
              e.target.value = ''
            }}
          />
          {editingName ? (
            <div className="flex gap-2 w-full">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
                autoFocus
              />
              <Button size="sm" isLoading={renameMutation.isPending} onClick={() => renameMutation.mutate()}>
                Save
              </Button>
            </div>
          ) : (
            <button
              onClick={() => iAmAdmin && setEditingName(true)}
              className={cn('flex items-center gap-1.5', iAmAdmin && 'cursor-pointer hover:opacity-80')}
            >
              <p className="font-bold text-fg text-base">{group.name}</p>
              {iAmAdmin && <Pencil className="size-3.5 text-fg-muted" />}
            </button>
          )}
          <p className="text-xs text-fg-muted">{pluralize(group.participants.length, 'member')}</p>
        </div>

        <div className="px-4 py-3.5 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-fg-muted">Members</p>
            {iAmAdmin && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                <UserPlus className="size-3.5" /> Add
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.participants.map((p) => (
              <GroupMemberRow key={p.userId} conversation={conversation} userId={p.userId} role={p.role} />
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-danger-500 hover:bg-surface-hover cursor-pointer text-left"
        >
          <LogOut className="size-4" /> Leave group
        </button>
      </div>

      <AddGroupMembersModal conversation={conversation} open={showAddMembers} onClose={() => setShowAddMembers(false)} />

      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 border border-danger-200/60 dark:border-danger-800/40 shrink-0">
              <LogOut className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Leave "{group.name}"?</h3>
              <p className="text-xs text-fg-muted mt-0.5">You'll need to be added back to rejoin.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button variant="secondary" size="sm" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={leaveMutation.isPending} onClick={() => leaveMutation.mutate()}>
              Leave group
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function MessageSenderAvatar({ senderId, isGroup, otherUser }: { senderId: string; isGroup: boolean; otherUser?: User }) {
  const { data: groupSender } = useUser(isGroup ? senderId : undefined)
  const user = isGroup ? groupSender : otherUser
  return <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size="xs" />
}

function GroupSenderLabel({ senderId }: { senderId: string }) {
  const { data: user } = useUser(senderId)
  if (!user) return null
  return <p className="text-[11px] font-semibold text-fg-muted mb-0.5 ml-8">{user.name}</p>
}

function ReplyPreviewStrip({
  replyTo,
  isOwn,
  replySenderId,
  currentUserId,
  onJumpToMessage,
}: {
  replyTo: Message['replyTo']
  isOwn: boolean
  replySenderId: string
  currentUserId: string | undefined
  onJumpToMessage: (messageId: string) => void
}) {
  const { data: originalSender } = useUser(replyTo?.senderId)
  // Only needed to name a THIRD party in a group thread — for isOwn it's "You", and for a
  // direct chat the reply can only ever be from the one other participant already on screen.
  const needsReplySenderName = !isOwn && replyTo?.senderId === currentUserId
  const { data: replySender } = useUser(needsReplySenderName ? replySenderId : undefined)
  if (!replyTo) return null

  const originalIsMe = replyTo.senderId === currentUserId
  const relationshipLabel = isOwn
    ? `You replied to ${originalIsMe ? 'yourself' : (originalSender?.name ?? '…')}`
    : originalIsMe
      ? `${replySender?.name ?? 'They'} replied to you`
      : `${originalSender?.name ?? 'They'} was quoted`

  return (
    <button
      type="button"
      onClick={() => onJumpToMessage(replyTo.id)}
      aria-label={`Jump to original message from ${originalSender?.name ?? 'this person'}`}
      className={cn(
        'flex flex-col w-full min-w-0 text-left rounded-md pl-2 pr-2.5 py-1 mb-1.5 border-l-2 max-w-full cursor-pointer transition-colors',
        isOwn ? 'bg-black/10 border-white/50 hover:bg-black/15' : 'bg-fg/5 border-brand-400 hover:bg-fg/10',
      )}
    >
      <p className={cn('text-[10px] font-medium truncate opacity-75', isOwn ? 'text-white/90' : 'text-fg-muted')}>{relationshipLabel}</p>
      <p className={cn('text-xs truncate', isOwn ? 'text-white/85' : 'text-fg')}>
        {replyTo.type === 'SHARED_POST' ? '📷 Shared a post' : replyTo.contentSnippet}
      </p>
    </button>
  )
}

function getMessageStatusLabel(msg: Message): string {
  if (msg.failed) return 'Failed to send'
  if (msg.pending) return 'Sending…'
  if (msg.isRead) return `Seen ${msg.readAt ? formatSeenTime(msg.readAt) : 'just now'}`
  return 'Sent'
}

function MessageRow({
  msg,
  isOwn,
  isLast,
  isLastOwnMessage,
  isGroup,
  otherUser,
  selectMode,
  isSelected,
  conversationId,
  myId,
  highlightedMessageId,
  registerRef,
  onToggleSelected,
  onReply,
  onEdit,
  onUnsend,
  onDelete,
  onJumpToMessage,
  onRetry,
}: {
  msg: Message
  isOwn: boolean
  isLast: boolean
  isLastOwnMessage: boolean
  isGroup: boolean
  otherUser?: User
  selectMode: boolean
  isSelected: boolean
  conversationId: string
  myId: string | undefined
  highlightedMessageId: string | null
  registerRef: (el: HTMLDivElement | null) => void
  onToggleSelected: (messageId: string) => void
  onReply: () => void
  onEdit: () => void
  onUnsend: () => void
  onDelete: () => void
  onJumpToMessage: (messageId: string) => void
  onRetry: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Swipe is a mobile-only affordance in practice: without a touchscreen no touchstart ever
  // fires, so this is fully inert on desktop and the existing hover/dropdown reply path is
  // untouched. Disabled during select-mode so a drag can't fight message multi-select.
  // A pending/failed send has no real server id yet, so replying to it or deleting it would hit
  // the API with a temp id — both actions (and the swipe/long-press gestures that lead to one of
  // them) are disabled until it's actually persisted. An unsent message is a tombstone with
  // nothing left to act on, so it's excluded the same way.
  const actionsEnabled = !selectMode && !msg.pending && !msg.failed && !msg.unsentAt
  const {
    ref: swipeRef,
    revealWidth,
    revealOpacity,
    isDragging,
  } = useSwipeToReply<HTMLDivElement>({
    onTriggered: onReply,
    onLongPress: () => setMenuOpen(true),
    enabled: actionsEnabled,
  })

  const replyRevealIcon = (
    <div
      className="shrink-0 overflow-hidden flex items-center justify-center"
      style={{
        width: revealWidth,
        opacity: revealOpacity,
        transition: isDragging ? 'none' : 'width 200ms ease-out, opacity 200ms ease-out',
      }}
    >
      <Reply className="size-3.5 text-brand-500 shrink-0" />
    </div>
  )

  // Edit is text-only: a SHARED_POST message has no separate caption field to edit, and its
  // attachment/link itself is never editable — matching the backend's own restriction.
  const canEdit = isOwn && msg.type === 'TEXT'

  const messageOptionsMenu = actionsEnabled && (
    <DropdownMenu
      align={isOwn ? 'right' : 'left'}
      className="min-w-[150px]"
      open={menuOpen}
      onOpenChange={setMenuOpen}
      trigger={
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-lg text-fg-muted/70 hover:text-fg hover:bg-surface-hover cursor-pointer transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-40 hover:!opacity-100"
          aria-label="Message options"
        >
          <MoreHorizontal className="size-4" />
        </button>
      }
    >
      <DropdownItem icon={<Reply className="size-4" />} onClick={onReply}>
        Reply
      </DropdownItem>
      {canEdit && (
        <DropdownItem icon={<Pencil className="size-4" />} onClick={onEdit}>
          Edit
        </DropdownItem>
      )}
      {isOwn && (
        <DropdownItem icon={<Undo2 className="size-4" />} onClick={onUnsend}>
          Unsend
        </DropdownItem>
      )}
      <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={onDelete}>
        Delete for me
      </DropdownItem>
    </DropdownMenu>
  )

  const metaParts = [
    msg.editedAt ? 'Edited' : null,
    isOwn && isLastOwnMessage ? getMessageStatusLabel(msg) : null,
  ].filter((p): p is string => !!p)

  return (
    <div
      ref={(el) => {
        registerRef(el)
        swipeRef.current = el
      }}
      data-message-id={msg.id}
      // A definite w-full row is what lets the max-w-[70%] below resolve against the chat
      // column's real width — nesting it straight inside a shrink-to-fit flex item instead
      // makes the browser size that ancestor to exactly the bubble's own content, so "70% of
      // it" clips below the content's natural size and every message wraps far too early.
      // touch-pan-y hints the browser to keep native vertical scrolling; the swipe hook only
      // ever calls preventDefault once a gesture is confirmed horizontal.
      className={cn('flex w-full touch-pan-y', isOwn ? 'justify-end' : 'justify-start')}
    >
      {/* This wrapper — not the row above — carries the percentage max-width, and everything
          inside it uses max-w-full (100%) instead: percentages only resolve correctly against a
          definite ancestor width, and the w-full row above is the last definite one in the chain.
          Nesting the % cap any deeper, against a shrink-to-fit ancestor, makes the browser size
          that ancestor to exactly the bubble's own content — so "70% of it" always clips below
          the content's natural size and messages wrap far too early. */}
      <div className={cn('flex flex-col gap-0.5 max-w-[85%] sm:max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {msg.unsentAt ? (
          // Global tombstone: content/attachment are gone for everyone at this point, so there's
          // nothing left to reply to, edit, or act on — no options menu, no reply-reveal here.
          <div
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs italic text-fg-muted/70 bg-surface-sunken/50 border border-border/40 transition-shadow duration-500',
              highlightedMessageId === msg.id && 'ring-2 ring-brand-500',
            )}
          >
            <Undo2 className="size-3.5 shrink-0 opacity-60" />
            {isOwn ? 'You unsent a message' : 'This message was unsent'}
          </div>
        ) : (
        <div className={cn('group flex items-end gap-1.5 max-w-full', isOwn && 'flex-row-reverse')}>
          {!isOwn &&
            (isLast ? (
              <MessageSenderAvatar senderId={msg.senderId} isGroup={isGroup} otherUser={otherUser} />
            ) : (
              <span className="size-6 shrink-0" />
            ))}

          {selectMode && (
            <button
              type="button"
              onClick={() => onToggleSelected(msg.id)}
              aria-label={isSelected ? 'Deselect message' : 'Select message'}
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors cursor-pointer',
                isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-border-strong hover:border-brand-500',
              )}
            >
              {isSelected && <Check className="size-3" />}
            </button>
          )}

          {msg.type === 'SHARED_POST' ? (
            <>
              {/* iconSlot + content share one never-reversed inner row, so growing the icon
                  always pushes THIS content right — a direct sibling of the reversed outer
                  row would instead push whatever comes after it (the options button) on an
                  own-message, leaving the bubble itself looking like it never moved. */}
              <div className="flex items-end">
                {replyRevealIcon}
                <div
                  className={cn(
                    'flex flex-col gap-1.5 min-w-0 transition-shadow duration-500 rounded-xl',
                    isOwn && 'items-end',
                    highlightedMessageId === msg.id && 'ring-2 ring-brand-500',
                  )}
                >
                  <SharedPostPreview message={msg} conversationId={conversationId} />
                  {msg.content && (
                    <div
                      className={cn(
                        'w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
                        isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-surface-sunken text-fg rounded-bl-sm border border-border/60',
                      )}
                    >
                      {msg.replyTo && (
                        <ReplyPreviewStrip
                          replyTo={msg.replyTo}
                          isOwn={isOwn}
                          replySenderId={msg.senderId}
                          currentUserId={myId}
                          onJumpToMessage={onJumpToMessage}
                        />
                      )}
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
              {messageOptionsMenu}
            </>
          ) : (
            <>
              <div className="flex items-end">
                {replyRevealIcon}
                <div
                  className={cn(
                    'w-fit min-w-0 max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words transition-shadow duration-500',
                    isOwn ? 'bg-brand-600 text-white rounded-br-sm shadow-2xs' : 'bg-surface-sunken text-fg rounded-bl-sm border border-border/60',
                    highlightedMessageId === msg.id && 'ring-2 ring-brand-500',
                  )}
                >
                  {msg.replyTo && (
                    <ReplyPreviewStrip
                      replyTo={msg.replyTo}
                      isOwn={isOwn}
                      replySenderId={msg.senderId}
                      currentUserId={myId}
                      onJumpToMessage={onJumpToMessage}
                    />
                  )}
                  {msg.content}
                </div>
              </div>
              {messageOptionsMenu}
            </>
          )}
        </div>
        )}

        {/* "Edited" (any edited message) and the Instagram-style text status — Sent / Seen <time>,
            never a checkmark, shown only on the most recent message I sent — share one compact,
            subtle line rather than each getting their own, matching the existing timestamp/status
            arrangement. Suppressed entirely on a tombstone: nothing left to annotate. */}
        {!msg.unsentAt && metaParts.length > 0 && (
          <p
            key={metaParts.join('|')}
            className={cn(
              'text-[10px] px-1 animate-in fade-in duration-300',
              msg.failed ? 'text-danger-500' : 'text-fg-muted/80',
            )}
          >
            {metaParts.join(' · ')}
            {msg.failed && (
              <button type="button" onClick={onRetry} className="ml-1.5 font-semibold underline cursor-pointer">
                Retry
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function ComposerReplyPreview({
  replyingTo,
  myId,
  onCancel,
}: {
  replyingTo: Message
  myId: string | undefined
  onCancel: () => void
}) {
  const isOwn = replyingTo.senderId === myId
  const { data: sender } = useUser(isOwn ? undefined : replyingTo.senderId)
  const label = isOwn ? 'yourself' : (sender?.name ?? '…')
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-2.5 text-xs">
      <div className="flex-1 min-w-0 flex items-start gap-1.5 rounded-lg bg-surface-sunken border-l-2 border-brand-500 px-2.5 py-1.5">
        <Reply className="size-3.5 text-brand-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-fg truncate">Replying to {label}</p>
          <p className="text-fg-muted truncate">{replyingTo.type === 'SHARED_POST' ? '📷 Shared a post' : replyingTo.content}</p>
        </div>
      </div>
      <button type="button" onClick={onCancel} className="text-fg-muted hover:text-fg cursor-pointer shrink-0" aria-label="Cancel reply">
        <X className="size-4" />
      </button>
    </div>
  )
}

function ComposerEditingBanner({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-2.5 text-xs">
      <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-lg bg-surface-sunken border-l-2 border-brand-500 px-2.5 py-1.5">
        <Pencil className="size-3.5 text-brand-500 shrink-0" />
        <p className="font-semibold text-fg">Editing message</p>
      </div>
      <button type="button" onClick={onCancel} className="text-fg-muted hover:text-fg cursor-pointer shrink-0" aria-label="Cancel edit">
        <X className="size-4" />
      </button>
    </div>
  )
}

function ChatPanel({ conversationId }: { conversationId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: conversations } = useConversations()
  const currentConversation = conversations?.find((c) => c.id === conversationId)
  const isGroup = currentConversation?.type === 'GROUP'
  const otherUserId = isGroup ? undefined : currentConversation?.participantIds.find((p) => p !== getCurrentUserId())
  const { data: otherUser } = useUser(otherUserId)
  const { data: messages, isLoading, isError, refetch } = useMessages(conversationId)
  const sendMutation = useSendMessage(conversationId)
  const editMutation = useEditMessage(conversationId)
  const unsendMutation = useUnsendMessage(conversationId)
  const markReadMutation = useMarkConversationRead(conversationId)
  const markRead = markReadMutation.mutate
  const hideMessagesMutation = useHideMessagesForMe(conversationId)
  const [draft, setDraft] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [unsendTarget, setUnsendTarget] = useState<Message | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const messageRowRefs = useRef(new Map<string, HTMLDivElement>())
  const composerInputRef = useRef<HTMLInputElement>(null)
  const myId = getCurrentUserId()

  // Reply and edit share one composer, so starting one always cancels the other.
  function startReply(msg: Message) {
    setEditingMessage(null)
    setReplyingTo(msg)
  }

  function startEdit(msg: Message) {
    setReplyingTo(null)
    setEditingMessage(msg)
    setDraft(msg.content)
  }

  function cancelEdit() {
    setEditingMessage(null)
    setDraft('')
  }

  useEffect(() => {
    if (editingMessage) composerInputRef.current?.focus()
  }, [editingMessage])

  function confirmUnsend() {
    if (!unsendTarget) return
    unsendMutation.mutate(unsendTarget.id, {
      onSuccess: () => setUnsendTarget(null),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not unsend message'),
    })
  }

  function jumpToMessage(messageId: string) {
    const el = messageRowRefs.current.get(messageId)
    if (!el) {
      toast.info('Original message unavailable')
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedMessageId(messageId)
    window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current))
    }, 1500)
  }

  function toggleSelected(messageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) next.delete(messageId)
      else next.add(messageId)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function confirmDelete() {
    if (!deleteTarget) return
    hideMessagesMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success(deleteTarget.length > 1 ? 'Messages removed from your view' : 'Message removed from your view')
        setDeleteTarget(null)
        exitSelectMode()
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Could not remove message')
      },
    })
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const lastScrolledConversationRef = useRef<string | null>(null)

  useEffect(() => {
    markRead()
    setReplyingTo(null)
    setEditingMessage(null)
  }, [conversationId, markRead])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  useEffect(() => {
    if (!messages) return
    // Opening or switching to a conversation always jumps straight to the latest message —
    // the scroll container otherwise defaults to the top (oldest messages) on every mount.
    const isNewConversation = lastScrolledConversationRef.current !== conversationId
    if (isNewConversation) {
      lastScrolledConversationRef.current = conversationId
      isNearBottomRef.current = true
    }
    if (isNewConversation || isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: isNewConversation ? 'auto' : 'smooth' })
    }
  }, [conversationId, messages])

  function handleSend(e: FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return

    if (editingMessage) {
      // Unchanged content is a deliberate no-op — nothing to save, so no request is made.
      if (trimmed === editingMessage.content.trim()) {
        cancelEdit()
        return
      }
      editMutation.mutate(
        { messageId: editingMessage.id, content: trimmed },
        {
          onSuccess: cancelEdit,
          // Keep the draft and editingMessage intact on failure — the original message is
          // untouched server-side, and the user's in-progress edit shouldn't be lost either.
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not edit message'),
        },
      )
      return
    }

    const replyToPreview: Message['replyTo'] = replyingTo
      ? {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          type: replyingTo.type,
          contentSnippet: replyingTo.type === 'SHARED_POST' ? 'Shared a post' : replyingTo.content.slice(0, 120),
        }
      : undefined
    sendMutation.mutate({ content: trimmed, replyToMessageId: replyingTo?.id, replyToPreview })
    setDraft('')
    setReplyingTo(null)
  }

  function retryFailedMessage(msg: Message) {
    queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) => existing?.filter((m) => m.id !== msg.id))
    sendMutation.mutate({ content: msg.content, replyToMessageId: msg.replyToMessageId, replyToPreview: msg.replyTo })
  }

  const groups = messages ? groupMessages(messages) : []
  const lastOwnMessageId = [...(messages ?? [])].reverse().find((m) => m.senderId === myId)?.id ?? null

  // The status line's relative time ("Seen 2m ago" -> "Seen 3m ago") only advances if something
  // re-renders it — nothing else in this component changes on a pure time tick, so this exists
  // purely to keep that text live without needing a page action.
  const [, forceStatusTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => forceStatusTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex h-full flex-1 min-w-0">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border/70 bg-surface">
          {selectMode ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={exitSelectMode}
                  aria-label="Cancel selection"
                  className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                >
                  <X className="size-5" />
                </button>
                <p className="text-sm font-semibold text-fg">{selectedIds.size} selected</p>
              </div>
              <Button
                size="sm"
                variant="danger-subtle"
                leftIcon={<Trash2 className="size-4" />}
                disabled={selectedIds.size === 0}
                onClick={() => setDeleteTarget([...selectedIds])}
              >
                Delete for me
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => navigate('/messages')}
                  className="sm:hidden flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg -ml-1 cursor-pointer transition-colors"
                  aria-label="Back to messages"
                >
                  <ArrowLeft className="size-5" />
                </button>
                {isGroup && currentConversation ? (
                  <button onClick={() => setDetailsOpen(true)} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
                    <GroupAvatar conversation={currentConversation} size="sm" />
                    <p className="font-bold text-fg text-sm truncate">{groupDisplayName(currentConversation)}</p>
                  </button>
                ) : (
                  otherUser && (
                    <Link to={`/people/${otherUser.id}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
                      <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="sm" />
                      <p className="font-bold text-fg text-sm truncate">{currentConversation?.nickname || otherUser.name}</p>
                    </Link>
                  )
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages && messages.length > 0 && (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Select messages"
                  >
                    <CheckSquare className="size-4.5" />
                  </button>
                )}
                <button
                  onClick={() => setDetailsOpen((o) => !o)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg cursor-pointer transition-colors',
                    detailsOpen ? 'bg-surface-selected text-brand-600' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                  )}
                  aria-label="Conversation details"
                >
                  <Info className="size-4.5" />
                </button>
              </div>
            </>
          )}
        </div>

        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
          {/* min-h-full + justify-end anchors a short conversation to the bottom, right above the
              composer, instead of pinning it to the top and leaving a large dead gap above the
              input — matches how every mainstream chat app lays out a thread with few messages.
              Once messages overflow the container, this has no effect and it scrolls normally. */}
          <div className="max-w-[900px] mx-auto flex flex-col w-full min-h-full justify-end">
            {isLoading ? (
              <Skeleton className="h-10 w-2/3 rounded-lg" />
            ) : isError ? (
              <ErrorState title="Couldn't load messages" onRetry={refetch} />
            ) : groups.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="size-5" />}
                title="No messages yet"
                description="Send a message to start the conversation."
                className="border-none py-10"
              />
            ) : (
              groups.map((group, gi) => {
                const groupIsOwn = group.senderId === myId
                return (
                <div key={gi} className="flex flex-col gap-0.5 mb-3">
                  <div className="flex justify-center mb-2">
                    <span className="text-[11px] text-fg-muted font-medium">{formatDateTime(group.messages[0].createdAt)}</span>
                  </div>
                  {isGroup && !groupIsOwn && <GroupSenderLabel senderId={group.senderId} />}
                  {group.messages.map((msg, mi) => {
                    const isOwn = msg.senderId === myId
                    const isLast = mi === group.messages.length - 1
                    // "Delete for me" only ever changes the current user's own visibility, so it's
                    // available on every message — including ones sent by the other participant.
                    const isSelected = selectedIds.has(msg.id)
                    return (
                      <MessageRow
                        key={msg.id}
                        msg={msg}
                        isOwn={isOwn}
                        isLast={isLast}
                        isLastOwnMessage={msg.id === lastOwnMessageId}
                        isGroup={!!isGroup}
                        otherUser={otherUser}
                        selectMode={selectMode}
                        isSelected={isSelected}
                        conversationId={conversationId}
                        myId={myId}
                        highlightedMessageId={highlightedMessageId}
                        registerRef={(el) => {
                          if (el) messageRowRefs.current.set(msg.id, el)
                          else messageRowRefs.current.delete(msg.id)
                        }}
                        onToggleSelected={toggleSelected}
                        onReply={() => startReply(msg)}
                        onEdit={() => startEdit(msg)}
                        onUnsend={() => setUnsendTarget(msg)}
                        onDelete={() => setDeleteTarget([msg.id])}
                        onJumpToMessage={jumpToMessage}
                        onRetry={() => retryFailedMessage(msg)}
                      />
                    )
                  })}
                </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {currentConversation?.blocked ? (
          <div className="px-4 py-4 border-t border-border/70 text-center text-sm text-fg-muted bg-surface-sunken/40">
            You can't reply to this conversation
          </div>
        ) : (
          <div className="border-t border-border/70 bg-surface">
            {editingMessage ? (
              <ComposerEditingBanner onCancel={cancelEdit} />
            ) : (
              replyingTo && <ComposerReplyPreview replyingTo={replyingTo} myId={myId} onCancel={() => setReplyingTo(null)} />
            )}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
              <input
                ref={composerInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-full border border-border bg-surface-sunken/70 px-4 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label={editingMessage ? 'Save edit' : 'Send message'}
                className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 cursor-pointer shrink-0 transition-all active:scale-95 shadow-xs"
              >
                {editingMessage ? <Check className="size-4" /> : <Send className="size-4" />}
              </button>
            </form>
          </div>
        )}
      </div>

      {detailsOpen && currentConversation && (isGroup || otherUser) && (
        <DetailsPanel conversation={currentConversation} otherUser={otherUser} onClose={() => setDetailsOpen(false)} />
      )}

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 border border-danger-200/60 dark:border-danger-800/40 shrink-0">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">
                {deleteTarget && deleteTarget.length > 1 ? `Delete ${deleteTarget.length} messages for you?` : 'Delete message for you?'}
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">Removed only from your personal view.</p>
            </div>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">
            This can't be undone. It only removes {deleteTarget && deleteTarget.length > 1 ? 'these messages' : 'this message'} from your own view — {isGroup ? 'everyone else' : (otherUser?.name ?? 'the other person')} will still see {deleteTarget && deleteTarget.length > 1 ? 'them' : 'it'} normally.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={hideMessagesMutation.isPending}
              onClick={confirmDelete}
            >
              Delete for me
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={unsendTarget !== null} onClose={() => setUnsendTarget(null)} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-950/40 text-danger-600 dark:text-danger-400 border border-danger-200/60 dark:border-danger-800/40 shrink-0">
              <Undo2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Unsend message?</h3>
              <p className="text-xs text-fg-muted mt-0.5">This will remove this message for everyone.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button variant="secondary" size="sm" onClick={() => setUnsendTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={unsendMutation.isPending} onClick={confirmUnsend}>
              Unsend
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const { data: conversations, isLoading, isError, refetch } = useConversations()
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all')

  const directUnread = conversations?.filter((c) => c.type !== 'GROUP' && c.unreadCount > 0).length ?? 0
  const groupUnread = conversations?.filter((c) => c.type === 'GROUP' && c.unreadCount > 0).length ?? 0
  const totalUnread = directUnread + groupUnread
  const filteredConversations = useMemo(() => {
    if (!conversations || filter === 'all') return conversations
    return conversations.filter((c) => (filter === 'group' ? c.type === 'GROUP' : c.type !== 'GROUP'))
  }, [conversations, filter])

  useEffect(() => {
    // Only auto-select a conversation on wider desktop screens (>= 640px)
    if (typeof window === 'undefined' || window.innerWidth < 640) return
    if (conversationId) return

    let cancelled = false
    // Resolve against a fresh fetch rather than whatever `['conversations']` has cached
    // (staleTime: 15s, refetchOnWindowFocus: false) — a socket reconnect that missed an
    // update would otherwise land the auto-redirect on a stale "most recent" conversation,
    // and it never re-fires afterward since conversationId is then already set.
    refetch().then((result) => {
      if (cancelled) return
      const list = result.data
      if (list && list.length > 0) {
        navigate(`/messages/${list[0].id}`, { replace: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [conversationId, navigate, refetch])

  return (
    <div className="h-[calc(100dvh-8rem)] flex rounded-2xl border border-border/80 bg-surface shadow-xs overflow-hidden">
      {/* Left conversation list */}
      <div
        className={cn(
          'w-full sm:w-[320px] lg:w-[360px] shrink-0 border-r border-border/70 overflow-y-auto p-3 flex-col',
          conversationId ? 'hidden sm:flex' : 'flex',
        )}
      >
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          <h1 className="text-lg font-bold text-fg tracking-tight">Messages</h1>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            <Users className="size-3.5" /> New group
          </button>
        </div>
        {conversations && conversations.length > 0 && (
          <div className="px-2 pb-2.5">
            <PillTabs
              items={[
                { key: 'all', label: 'All', count: totalUnread > 0 ? totalUnread : undefined },
                { key: 'direct', label: 'Direct', count: directUnread > 0 ? directUnread : undefined },
                { key: 'group', label: 'Groups', count: groupUnread > 0 ? groupUnread : undefined },
              ]}
              value={filter}
              onChange={(k) => setFilter(k as 'all' | 'direct' | 'group')}
            />
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col gap-2 p-1">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState title="Couldn't load conversations" onRetry={refetch} />
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredConversations.map((c) => (
              <ConversationListItem key={c.id} conversation={c} active={c.id === conversationId} />
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title={filter === 'group' ? 'No groups yet' : 'No direct messages yet'}
            className="border-none py-10"
          />
        ) : (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="No conversations yet"
            description="Start a conversation from a profile or connection."
            className="border-none py-10"
          />
        )}
      </div>

      {/* Right chat panel */}
      <div
        className={cn(
          'flex-1 min-w-0 h-full',
          conversationId ? 'flex' : 'hidden sm:flex',
        )}
      >
        {conversationId ? (
          <ChatPanel conversationId={conversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-fg-muted text-sm gap-2.5 p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-sunken text-fg-muted border border-border/60">
              <MessageSquare className="size-6" />
            </div>
            <p className="font-semibold text-fg">Your Messages</p>
            <p className="text-xs text-fg-muted max-w-xs">Select a conversation from the list to continue chatting with fellow builders.</p>
          </div>
        )}
      </div>

      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </div>
  )
}
