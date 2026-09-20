import { useEffect, useRef } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { onSocketReconnect, subscribeToUserConversations } from '@/lib/socket-client'
import { getCurrentUserId, getUser } from '@/services/users.service'
import { listConversations, type ConversationDto } from '@/services/messages.service'
import { useToastStore } from '@/store/toast.store'
import type { Conversation } from '@/types'

/** A message this old, arriving for a conversation we have no record of, is history — not news. */
const UNKNOWN_CONVERSATION_MAX_AGE_MS = 2 * 60 * 1000

/** What a conversation looked like the last time we saw it. */
interface Seen {
  /** last message id + unread count: identical means "the same update again", not a new message. */
  signature: string
  at: number
}

const signatureOf = (lastMessageId: string, unreadCount: number) => `${lastMessageId}:${unreadCount}`

function previewOf(type: string, content: string, hasSharedPost: boolean): string {
  const text = content.replace(/\s+/g, ' ').trim()
  if ((type === 'SHARED_POST' || hasSharedPost) && !text) return 'Shared a post'
  return text
}

/**
 * Shows a 2-second banner when a chat message arrives for a conversation the member isn't looking at.
 * Renders nothing. Mounted once in the app shell.
 *
 * It listens to the per-user conversations topic that the app already subscribes to over its single
 * WebSocket — no second connection. That event carries the conversation id and the last message, so a
 * tap navigates by id and nothing is looked up by sender name. Chat messages deliberately create no
 * persistent notification (see ConversationService on the backend).
 *
 * That topic also fires for things that are not new messages (a group being renamed, someone being
 * added), re-sending the same conversation state. So each conversation's last seen state is kept and
 * only a change in it counts as an arrival. The state is the last-message id AND the unread count,
 * not the id alone: messages are timestamped to the second, so several sent within one second can
 * leave the server reporting an earlier one as "last", while the unread count still moves.
 */
export function IncomingMessageToaster() {
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const myId = getCurrentUserId()

  // The handler outlives any single render, so it reads which conversation is open through a ref.
  const openConversationId = useRef<string | null>(null)
  useEffect(() => {
    openConversationId.current = matchPath('/messages/:conversationId', pathname)?.params.conversationId ?? null
  }, [pathname])

  useEffect(() => {
    if (!myId) return

    const seen = new Map<string, Seen>()
    let latestTicket = 0

    // Baseline: how each conversation already looked, so old messages re-sent by other kinds of
    // updates (and anything that arrived while offline) never toast. Never overwrites something
    // newer that the live handler has already recorded.
    const seed = (list: Conversation[]) => {
      for (const c of list) {
        if (!c.lastMessage) continue
        const at = Date.parse(c.lastMessage.createdAt)
        const existing = seen.get(c.id)
        if (!existing || at >= existing.at) seen.set(c.id, { signature: signatureOf(c.lastMessage.id, c.unreadCount), at })
      }
    }
    const loadBaseline = () =>
      queryClient
        .fetchQuery({ queryKey: ['conversations'], queryFn: listConversations, staleTime: 15_000 })
        .then(seed)
        .catch(() => undefined)

    const onUpdate = (dto: ConversationDto) => {
      const last = dto.lastMessage
      if (!last) return

      const signature = signatureOf(last.id, dto.unreadCount)
      const at = Date.parse(last.createdAt)
      const previous = seen.get(dto.id)
      seen.set(dto.id, { signature, at: Math.max(at, previous?.at ?? 0) })

      if (previous?.signature === signature) return // the same update again: not a new arrival
      if (last.senderId === myId) return
      if (last.unsentAt) return
      if (dto.unreadCount === 0) return // nothing unread, so nothing new to tell them about
      if (dto.muted || dto.blocked) return
      if (!previous && Date.now() - at > UNKNOWN_CONVERSATION_MAX_AGE_MS) return
      if (openConversationId.current === dto.id) return // already reading this exact conversation

      const ticket = ++latestTicket
      const preview = previewOf(last.type, last.content, !!last.sharedPost)
      void queryClient
        .fetchQuery({ queryKey: ['user', last.senderId], queryFn: () => getUser(last.senderId), staleTime: 60_000 })
        .catch(() => undefined)
        .then((sender) => {
          // A newer message arrived while the sender was being looked up, or the member has since
          // opened this conversation: that toast is no longer wanted.
          if (ticket !== latestTicket || openConversationId.current === dto.id) return
          const senderName = sender?.name ?? 'New message'
          useToastStore.getState().pushMessage({
            conversationId: dto.id,
            senderName: dto.groupInfo ? dto.groupInfo.name : dto.nickname || senderName,
            preview: dto.groupInfo ? `${senderName}: ${preview}` : preview,
            avatarUrl: dto.groupInfo ? (dto.groupInfo.avatarUrl ?? undefined) : sender?.avatarUrl,
          })
        })
    }

    const unsubscribe = subscribeToUserConversations<ConversationDto>(myId, onUpdate)
    // After a dropped connection, anything sent meanwhile is old news: re-read the baseline instead of toasting it.
    const unsubscribeReconnect = onSocketReconnect(() => void loadBaseline())
    void loadBaseline()

    return () => {
      unsubscribe()
      unsubscribeReconnect()
    }
  }, [myId, queryClient])

  return null
}
