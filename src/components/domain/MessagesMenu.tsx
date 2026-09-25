import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, X } from 'lucide-react'
import { useConversations, useUnreadMessageCount } from '@/hooks/useConversations'
import { useUser } from '@/hooks/useUser'
import { getCurrentUserId } from '@/services/users.service'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton, iconButtonActiveClasses } from '@/components/ui/IconButton'
import { NotificationDot } from '@/components/ui/NotificationDot'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Conversation } from '@/types'

function ConversationRow({ conversation, onOpen }: { conversation: Conversation; onOpen: (id: string) => void }) {
  const otherUserId = conversation.participantIds.find((p) => p !== getCurrentUserId())
  const { data: user } = useUser(otherUserId)
  const unread = conversation.lastMessage && conversation.lastMessage.senderId !== getCurrentUserId() && !conversation.lastMessage.isRead

  if (!user) return <Skeleton className="h-14 w-full rounded-lg" />

  return (
    <button
      type="button"
      onClick={() => onOpen(conversation.id)}
      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg cursor-pointer hover:bg-surface-hover transition-colors"
    >
      <Avatar src={user.avatarUrl} name={user.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm truncate', unread ? 'font-semibold text-fg' : 'font-medium text-fg')}>{user.name}</p>
          {conversation.lastMessage && (
            <span className="text-xs text-fg-muted shrink-0">{formatRelativeTime(conversation.lastMessage.createdAt)}</span>
          )}
        </div>
        <p className={cn('text-xs truncate mt-0.5', unread ? 'text-fg font-medium' : 'text-fg-muted')}>
          {conversation.lastMessage?.content ?? 'Say hello'}
        </p>
      </div>
      {unread && <span className="size-2 rounded-full bg-brand-500 shrink-0" aria-label="Unread" />}
    </button>
  )
}

/**
 * The single entry point to messaging in the top bar. On wide screens it opens a quick list of recent
 * conversations; on narrow screens (where a popover would be cramped) it goes straight to Messages.
 * It shows as "current" while the user is on the Messages page.
 */
export function MessagesMenu() {
  const location = useLocation()
  const navigate = useNavigate()
  // The menu is open for one specific page: navigating anywhere else closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === location.pathname
  const setOpen = (next: boolean) => setOpenPath(next ? location.pathname : null)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { data: conversations, isLoading } = useConversations()
  const unreadCount = useUnreadMessageCount()
  const onMessagesPage = location.pathname.startsWith('/messages')

  // Close on outside click, on Escape (returning focus to the button) and whenever the route changes.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenPath(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPath(null)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleClick() {
    const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    if (onMessagesPage || !wide) {
      navigate('/messages')
      return
    }
    setOpen(!open)
  }

  const preview = conversations?.slice(0, 5) ?? []
  const label = unreadCount > 0 ? `Messages, ${unreadCount} unread` : 'Messages'

  return (
    <div ref={ref} className="relative">
      <IconButton
        ref={buttonRef}
        label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={onMessagesPage ? 'page' : undefined}
        onClick={handleClick}
        className={cn('relative', onMessagesPage && iconButtonActiveClasses)}
      >
        <MessageSquare className="size-4.5" aria-hidden="true" />
        <NotificationDot count={unreadCount} />
      </IconButton>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] max-w-[85vw] max-h-[460px] flex flex-col rounded-xl border border-border/80 bg-surface shadow-xl overflow-hidden animate-in">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
            <p className="font-bold text-fg text-sm">Recent messages</p>
            <IconButton label="Close recent messages" className="size-7" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : preview.length > 0 ? (
              preview.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  onOpen={(id) => {
                    setOpen(false)
                    navigate(`/messages/${id}`)
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-fg-muted text-center py-8">No conversations yet</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/messages')
            }}
            className="border-t border-border-subtle px-4 py-2.5 text-sm font-medium text-fg-brand hover:underline cursor-pointer"
          >
            See all in Messages
          </button>
        </div>
      )}
    </div>
  )
}
