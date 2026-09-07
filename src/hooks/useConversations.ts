import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as messagesService from '@/services/messages.service'
import { getCurrentUserId } from '@/services/users.service'
import { onSocketReconnect, subscribeToConversation, subscribeToConversationReads, subscribeToUserConversations } from '@/lib/socket-client'
import type { Conversation, Message } from '@/types'
import { mapConversation, mapMessage, type ConversationDto, type MessageDto } from '@/services/messages.service'

export function useConversations() {
  const queryClient = useQueryClient()
  const myId = getCurrentUserId()

  useEffect(() => {
    if (!myId) return
    return subscribeToUserConversations<ConversationDto>(myId, (dto) => {
      const updated = mapConversation(dto)
      queryClient.setQueryData<Conversation[]>(['conversations'], (existing) => {
        if (!existing) return [updated]
        const idx = existing.findIndex((c) => c.id === updated.id)
        if (idx === -1) return [updated, ...existing]
        const next = [...existing]
        next[idx] = updated
        return next.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      })
    })
  }, [myId, queryClient])

  // A WebSocket drop-and-reconnect (network blip, laptop sleep/wake) loses nothing at the transport
  // level, but any conversation update published while disconnected is gone — STOMP topics don't
  // replay. Resync from the server once the socket is back instead of silently going stale.
  useEffect(() => {
    return onSocketReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [queryClient])

  return useQuery({
    queryKey: ['conversations'],
    queryFn: messagesService.listConversations,
  })
}

export function useUnreadMessageCount() {
  const { data } = useConversations()
  if (!data) return 0
  return data.filter((c) => c.unreadCount > 0).length
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  const myId = getCurrentUserId()

  useEffect(() => {
    if (!conversationId) return
    return subscribeToConversation<MessageDto>(conversationId, (dto) => {
      const incoming = mapMessage(dto)
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) => {
        if (!existing) return [incoming]
        const idx = existing.findIndex((m) => m.id === incoming.id)
        // A known id is an in-place update (edit or unsend), not a duplicate to ignore — this is
        // what lets a live edit/unsend from the other participant update on screen without a refresh.
        if (idx !== -1) {
          const next = [...existing]
          next[idx] = incoming
          return next
        }
        // Sorted insert rather than a blind append: two participants sending near-simultaneously can
        // have their broadcasts reach this client out of createdAt order (each send is its own HTTP
        // request on its own server thread — nothing ties broadcast order to write order under
        // concurrency, the same race the backend's own send-deadlock retry already accounts for).
        const next = [...existing, incoming]
        next.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      // The other participant is looking at this exact conversation right now (this subscription
      // only exists while it's open) — tell the server immediately so their "Sent" flips to "Seen"
      // live, instead of only on this client's next mount (the on-mount markRead in MessagesPage).
      if (incoming.senderId !== myId) {
        messagesService.markConversationRead(conversationId).then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        })
      }
    })
  }, [conversationId, queryClient, myId])

  // Real read receipts, not a faked status: this event fires for GROUP conversations too, but the
  // backend only ever flips the per-message is_read/read_at columns for DIRECT ones (group read
  // state is a single per-participant watermark, not per message — see markRead). Refetching and
  // trusting whatever the server actually returns — rather than optimistically flipping isRead
  // ourselves here — is what keeps a group's messages honestly stuck at "Sent" instead of this
  // event making every message falsely claim "Seen" the moment any one member opens the thread.
  useEffect(() => {
    if (!conversationId || !myId) return
    return subscribeToConversationReads(conversationId, ({ readBy }) => {
      if (readBy === myId) return // that's me marking it read, not the other person reading mine
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    })
  }, [conversationId, myId, queryClient])

  // Same resync-after-reconnect safety net as useConversations, scoped to whichever conversation is
  // currently open — otherwise a message sent by the other participant during a network drop would
  // never appear until the user manually reloads or navigates away and back.
  useEffect(() => {
    if (!conversationId) return
    return onSocketReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    })
  }, [conversationId, queryClient])

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesService.listMessages(conversationId!),
    enabled: !!conversationId,
  })
}

/** "Delete for me": hides the given message(s) from only the current user's own view — invalidating
 * both queries reflects that in this browser immediately; no WS event exists for this because the
 * other participant's view is never touched, so there's nothing for their client to react to. */
export function useHideMessagesForMe(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageIds: string[]) =>
      messageIds.length === 1
        ? messagesService.hideMessageForMe(conversationId!, messageIds[0])
        : messagesService.hideMessagesForMe(conversationId!, messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

interface SendMessageVariables {
  content: string
  replyToMessageId?: string
  /** Built by the caller from the message it already has in hand (the one being replied to), so
   * the optimistic bubble can render a real reply quote immediately instead of a blank one. */
  replyToPreview?: Message['replyTo']
}

/** Optimistic send: a "Sending…" placeholder appears immediately (client-generated temp id),
 * is swapped for the real persisted message on success, or flipped to a "Failed to send" state
 * (kept in the list, not discarded) on error so the existing retry affordance has something to
 * act on. */
export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ content, replyToMessageId }: SendMessageVariables) =>
      messagesService.sendMessage(conversationId!, content, undefined, replyToMessageId),
    onMutate: ({ content, replyToMessageId, replyToPreview }) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const myId = getCurrentUserId() ?? ''
      const optimistic: Message = {
        id: tempId,
        conversationId: conversationId!,
        senderId: myId,
        type: 'TEXT',
        content,
        replyToMessageId,
        replyTo: replyToPreview,
        createdAt: new Date().toISOString(),
        isRead: false,
        pending: true,
      }
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) =>
        existing ? [...existing, optimistic] : [optimistic],
      )
      return { tempId }
    },
    onSuccess: (message, _vars, context) => {
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) => {
        const withoutTemp = (existing ?? []).filter((m) => m.id !== context?.tempId && m.id !== message.id)
        return [...withoutTemp, message]
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_err, _vars, context) => {
      if (!context?.tempId) return
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) =>
        existing?.map((m) => (m.id === context.tempId ? { ...m, pending: false, failed: true } : m)),
      )
    },
  })
}

/** Edit: updates the existing message in place (never a new row) — the same real-time subscription
 * above upserts this same result if the other participant has the conversation open. */
export function useEditMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagesService.editMessage(conversationId!, messageId, content),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) =>
        existing?.map((m) => (m.id === message.id ? message : m)),
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Unsend: global for everyone, distinct from {@link useHideMessagesForMe} ("delete for me"). */
export function useUnsendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => messagesService.unsendMessage(conversationId!, messageId),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(['messages', conversationId], (existing) =>
        existing?.map((m) => (m.id === message.id ? message : m)),
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkConversationRead(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => messagesService.markConversationRead(conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
