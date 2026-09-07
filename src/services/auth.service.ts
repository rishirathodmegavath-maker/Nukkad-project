import { apiClient } from '@/lib/api-client'
import { persistSession, clearSession, getStoredSession } from '@/lib/session'
import type { DeviceSession, LoginCredentials, Session, SignupPayload } from '@/types'

export { getStoredSession } from '@/lib/session'

interface AuthResponseDto {
  user: { id: string; name: string; onboardingCompleted: boolean }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface RegisterResponseDto {
  email: string
  message: string
  verified: boolean
}

function toSession(dto: AuthResponseDto): Session {
  return {
    userId: dto.user.id,
    name: dto.user.name,
    onboardingCompleted: dto.user.onboardingCompleted,
    token: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAt: new Date(Date.now() + dto.expiresIn * 1000).toISOString(),
  }
}

export async function login(credentials: LoginCredentials): Promise<Session> {
  const dto = await apiClient.post<AuthResponseDto>('/auth/login', credentials)
  const session = toSession(dto)
  persistSession(session)
  return session
}

/** Register no longer logs the user in — the account starts unverified with no session. */
export async function signup(payload: SignupPayload): Promise<RegisterResponseDto> {
  return apiClient.post<RegisterResponseDto>('/auth/register', payload)
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token })
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await apiClient.post('/auth/resend-verification', { email })
}

/** Google can only authenticate an existing, already-linked Nukkad account — never creates one. */
export async function loginWithGoogle(idToken: string): Promise<Session> {
  const dto = await apiClient.post<AuthResponseDto>('/auth/google', { idToken })
  const session = toSession(dto)
  persistSession(session)
  return session
}

/** Redirect-flow counterpart: exchanges the OAuth authorization code Google handed back after
 * the full-page redirect for a Nukkad session, via the backend (which holds the client secret).
 * Subject to the same "must already be linked" policy as loginWithGoogle. */
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<Session> {
  const dto = await apiClient.post<AuthResponseDto>('/auth/google/code', { code, redirectUri })
  const session = toSession(dto)
  persistSession(session)
  return session
}

/** Links Google to the CURRENTLY authenticated account (called from Settings), never at login/signup. */
export async function linkGoogleAccount(idToken: string): Promise<void> {
  await apiClient.post('/auth/google/link', { idToken })
}

export async function requestPasswordReset(email: string): Promise<{ sent: true }> {
  await apiClient.post('/auth/password-reset/request', { email })
  return { sent: true }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword })
}

function currentRefreshTokenHeader(): Record<string, string> {
  const session = getStoredSession()
  return session?.refreshToken ? { 'X-Refresh-Token': session.refreshToken } : {}
}

export async function listSessions(): Promise<DeviceSession[]> {
  return apiClient.get<DeviceSession[]>('/auth/sessions', currentRefreshTokenHeader())
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/auth/sessions/${sessionId}`)
}

export async function logoutAllOtherSessions(): Promise<void> {
  await apiClient.post('/auth/sessions/logout-all', undefined, currentRefreshTokenHeader())
}

export async function logout(): Promise<void> {
  const session = getStoredSession()
  if (session?.refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken: session.refreshToken })
    } catch {
      // Best-effort server-side revoke — clear the local session regardless.
    }
  }
  clearSession()
}
