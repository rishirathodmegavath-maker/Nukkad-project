import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

/** A chat message that just arrived. Keeps the conversation id so a tap opens exactly that thread. */
export interface MessageToast {
  id: string
  conversationId: string
  senderName: string
  preview: string
  avatarUrl?: string
}

/** How long an incoming-message toast stays up. Short on purpose: it is a nudge, not a notification. */
export const MESSAGE_TOAST_MS = 2000

interface ToastState {
  toasts: Toast[]
  /** At most one: a newer message replaces the one on screen instead of stacking. */
  messageToast: MessageToast | null
  push: (message: string, tone?: ToastTone) => void
  dismiss: (id: string) => void
  pushMessage: (toast: Omit<MessageToast, 'id'>) => void
  dismissMessage: (id: string) => void
}

let messageToastTimer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  messageToast: null,
  push: (message, tone = 'info') => {
    const id = generateId('toast')
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushMessage: (toast) => {
    const id = generateId('msgtoast')
    // A newer message takes over the slot, so its 2 seconds start now — the older timer must not cut it short.
    clearTimeout(messageToastTimer)
    set({ messageToast: { ...toast, id } })
    messageToastTimer = setTimeout(() => {
      set((s) => (s.messageToast?.id === id ? { messageToast: null } : s))
    }, MESSAGE_TOAST_MS)
  },
  dismissMessage: (id) => set((s) => (s.messageToast?.id === id ? { messageToast: null } : s)),
}))

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
}
