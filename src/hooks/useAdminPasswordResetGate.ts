import { useQuery } from '@tanstack/react-query'
import { getAdminPasswordResetEnabled } from '@/services/admin-auth.service'

export type PasswordResetGate = 'loading' | 'enabled' | 'unavailable'

/**
 * Emailed password reset is switched off on the server until a mail provider exists (see the
 * backend's ADMIN_PASSWORD_RESET_ENABLED). Asking the server — rather than baking a flag into the
 * build — means turning it on later is a server setting only, with no new frontend release. If the
 * answer can't be read, treat it as unavailable: the form can't work then either.
 */
export function useAdminPasswordResetGate(): PasswordResetGate {
  const status = useQuery({
    queryKey: ['admin-password-reset-status'],
    queryFn: getAdminPasswordResetEnabled,
    retry: false,
    staleTime: 60_000,
  })
  if (status.isLoading) return 'loading'
  return status.data === true ? 'enabled' : 'unavailable'
}
