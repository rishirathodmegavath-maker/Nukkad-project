import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { getStoredSession } from '@/lib/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
/** Derives the STOMP endpoint from the REST API base URL — http(s) -> ws(s), strip trailing /api. */
const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws/websocket'

let client: Client | null = null
let hasConnectedOnce = false
// Re-registered per active subscription on every (re)connect — a Set so a cleanup can actually
// remove its entry instead of leaving a dead closure behind forever (the previous onConnect-chaining
// approach never shrank across a long session).
const connectListeners = new Set<() => void>()
// Fired only on a *re*connect (not the initial connect) — STOMP topics don't replay what was
// published while we were disconnected, so anything relying on realtime pushes needs to resync its
// own REST state after a drop instead of silently going stale.
const reconnectListeners = new Set<() => void>()

function getClient(): Client {
  if (client) return client
  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${getStoredSession()?.token ?? ''}` },
    reconnectDelay: 3000,
    beforeConnect: () => {
      client!.connectHeaders = { Authorization: `Bearer ${getStoredSession()?.token ?? ''}` }
    },
    onConnect: () => {
      if (hasConnectedOnce) {
        reconnectListeners.forEach((cb) => cb())
      }
      hasConnectedOnce = true
      connectListeners.forEach((cb) => cb())
    },
  })
  client.activate()
  return client
}

function subscribe<T>(destination: string, onMessage: (payload: T) => void): () => void {
  const c = getClient()
  let sub: StompSubscription | null = null

  const doSubscribe = () => {
    sub = c.subscribe(destination, (message: IMessage) => {
      onMessage(JSON.parse(message.body) as T)
    })
  }

  if (c.connected) doSubscribe()
  connectListeners.add(doSubscribe)

  return () => {
    connectListeners.delete(doSubscribe)
    sub?.unsubscribe()
  }
}

/** Subscribes to WebSocket reconnect events (i.e. resumed after a real drop, not the first connect)
 * so callers can resync whatever REST state they own — realtime pushes missed while disconnected are
 * gone for good otherwise. Returns an unsubscribe function. */
export function onSocketReconnect(cb: () => void): () => void {
  reconnectListeners.add(cb)
  return () => reconnectListeners.delete(cb)
}

export function subscribeToConversation<T>(conversationId: string, onMessage: (payload: T) => void) {
  return subscribe<T>(`/topic/conversations/${conversationId}`, onMessage)
}

export function subscribeToConversationReads(conversationId: string, onRead: (payload: { readBy: string; readAt: string }) => void) {
  return subscribe(`/topic/conversations/${conversationId}/read`, onRead)
}

export function subscribeToUserConversations<T>(userId: string, onUpdate: (payload: T) => void) {
  return subscribe<T>(`/topic/users/${userId}/conversations`, onUpdate)
}
