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
