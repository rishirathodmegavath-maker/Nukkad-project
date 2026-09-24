import type { Session } from '@/types'
import { isAdminPortal } from '@/lib/portal'

// Separate key per portal, so even if both ever ran on one origin (e.g. local development) an admin
// session and a member session could never overwrite or be mistaken for each other.
const SESSION_KEY = isAdminPortal ? 'buildadda.admin.session' : 'buildadda.session'
/** Pre-rebrand key name, still possibly sitting in an already-signed-in member's browser. */
const LEGACY_SESSION_KEY = 'nukkad.session'

/** One-time migration off the pre-rebrand key so an already-signed-in member isn't silently logged
 *  out the moment this ships — everything after this call only ever touches {@link SESSION_KEY}. */
function migrateLegacySessionKey() {
  if (isAdminPortal || localStorage.getItem(SESSION_KEY)) return
  const legacy = localStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacy) return
  localStorage.setItem(SESSION_KEY, legacy)
  localStorage.removeItem(LEGACY_SESSION_KEY)
}

export function getStoredSession(): Session | null {
  try {
    migrateLegacySessionKey()
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
