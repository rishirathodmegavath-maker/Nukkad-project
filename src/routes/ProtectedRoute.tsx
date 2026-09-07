import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // Missing/unknown treats as "already onboarded" so sessions persisted before this flag
  // existed aren't suddenly forced back through onboarding.
  const onboardingCompleted = useAuthStore((s) => s.session?.onboardingCompleted !== false)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const onOnboardingRoute = location.pathname === '/onboarding'
  if (!onboardingCompleted && !onOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }
  if (onboardingCompleted && onOnboardingRoute) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
