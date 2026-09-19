import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'

/**
 * UX-only gate: hides the Admin UI from non-admins and keeps a direct `/admin` visit from
 * flashing admin screens before redirecting. This is NOT the security boundary — every
 * `/api/admin/**` call is independently authorized server-side (see SecurityConfig), so a
 * network-level call to an admin endpoint is rejected with 403 regardless of what this
 * component renders.
 */
export function AdminRoute() {
  const { data: currentUser, isLoading } = useCurrentUser()

  if (isLoading) {
    return <CardSkeletonGrid count={3} />
  }

  if (!currentUser?.roles.includes('ADMIN')) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}
