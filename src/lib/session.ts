import type { Session } from '@/types'
import { isAdminPortal } from '@/lib/portal'

// Separate key per portal, so even if both ever ran on one origin (e.g. local development) an admin
// session and a member session could never overwrite or be mistaken for each other.
const SESSION_KEY = isAdminPortal ? 'buildadda.admin.session' : 'nukkad.session'

export function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: Session = JSON.parse(raw)
    if (!session.token || !session.refreshToken) return null
    return session
  } catch {
    return null
  }
}

export function persistSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
