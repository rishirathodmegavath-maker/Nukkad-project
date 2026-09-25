import { Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/auth.store'
import { lazyPage } from '@/lib/lazyPage'
import { isAdminPortal } from '@/lib/portal'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { RouteFallback } from '@/components/ui/RouteFallback'

// The two sites share one build, but a visitor only ever needs one of them: members never download the control
// panel and the admin host never downloads the member application.
const AppRoutes = lazyPage(() => import('@/routes/AppRoutes').then((m) => ({ default: m.AppRoutes })))
const AdminPortalRoutes = lazyPage(() => import('@/routes/AdminPortalRoutes').then((m) => ({ default: m.AdminPortalRoutes })))

export default function App() {
  const init = useAuthStore((s) => s.init)
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    init()
  }, [init])

  if (status !== 'ready') return null

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          {/* Two completely separate sites built from one codebase: the admin host only ever
              mounts the control panel, every other host only ever mounts the member application. */}
          <Suspense fallback={<RouteFallback />}>{isAdminPortal ? <AdminPortalRoutes /> : <AppRoutes />}</Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
