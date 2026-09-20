import { apiClient } from '@/lib/api-client'
import { clearSession, getStoredSession, persistSession } from '@/lib/session'
import { queryClient } from '@/lib/query-client'
import type { Session } from '@/types'

interface AdminAuthDto {
  admin: { id: string; email: string; name: string }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** Signs in to the admin portal. Same email + password as the account, but the server issues an
 *  admin-scoped session that only works against /api/admin/** — never the member application. */
export async function adminLogin(email: string, password: string): Promise<Session> {
  const dto = await apiClient.post<AdminAuthDto>('/admin/auth/login', { email, password })
  const session: Session = {
    userId: dto.admin.id,
    name: dto.admin.name,
    onboardingCompleted: true,
    token: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAt: new Date(Date.now() + dto.expiresIn * 1000).toISOString(),
  }
  queryClient.clear()
  persistSession(session)
  return session
}

/** Whether the server has emailed password reset switched on (it stays off until a mail provider is
 *  set up). Public — the sign-in screens ask before anyone is signed in. */
export async function getAdminPasswordResetEnabled(): Promise<boolean> {
  const status = await apiClient.get<{ enabled: boolean }>('/admin/auth/password-reset/status')
  return status.enabled === true
}

/** Emails the admin a one-time reset link. The server answers identically whether or not the address
 *  belongs to an administrator, so the caller must never claim an email was actually sent. */
export async function requestAdminPasswordReset(email: string): Promise<void> {
  await apiClient.post('/admin/auth/password-reset/request', { email })
}

export async function confirmAdminPasswordReset(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/admin/auth/password-reset/confirm', { token, newPassword })
}

/** Changes the signed-in admin's password. The server ends every session — including this one — so the
 *  local session is cleared too and the caller sends the admin back to sign in. */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/admin/auth/change-password', { currentPassword, newPassword })
  clearSession()
  queryClient.clear()
}

export async function adminLogout(): Promise<void> {
  const session = getStoredSession()
  try {
    if (session) await apiClient.post('/admin/auth/logout', { refreshToken: session.refreshToken })
  } catch {
    // Signing out locally must never be blocked by a failed network call.
  }
  clearSession()
  queryClient.clear()
}
