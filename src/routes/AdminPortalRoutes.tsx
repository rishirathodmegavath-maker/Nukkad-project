import { Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { getStoredSession } from '@/lib/session'
import { AdminPortalShell } from '@/pages/admin/AdminPortalShell'
import AdminLayout from '@/pages/admin/AdminLayout'
import { lazyPage } from '@/lib/lazyPage'
import { RouteFallback } from '@/components/ui/RouteFallback'

// Every page is its own chunk: opening the app downloads the shell and the page you land on, not all of them.
const AdminLoginPage = lazyPage(() => import('@/pages/admin/AdminLoginPage'))
const AdminForgotPasswordPage = lazyPage(() => import('@/pages/admin/AdminForgotPasswordPage'))
const AdminResetPasswordPage = lazyPage(() => import('@/pages/admin/AdminResetPasswordPage'))
const AdminDashboardPage = lazyPage(() => import('@/pages/admin/AdminDashboardPage'))
const AdminActivityPage = lazyPage(() => import('@/pages/admin/AdminActivityPage'))
const AdminUsersPage = lazyPage(() => import('@/pages/admin/AdminUsersPage'))
const AdminUserDetailPage = lazyPage(() => import('@/pages/admin/AdminUserDetailPage'))
const AdminStartupsPage = lazyPage(() => import('@/pages/admin/AdminStartupsPage'))
const AdminIdeasPage = lazyPage(() => import('@/pages/admin/AdminIdeasPage'))
const AdminGrantsPage = lazyPage(() => import('@/pages/admin/AdminGrantsPage'))
const AdminResourcesPage = lazyPage(() => import('@/pages/admin/AdminResourcesPage'))
const AdminEventsPage = lazyPage(() => import('@/pages/admin/AdminEventsPage'))
const AdminFeedPage = lazyPage(() => import('@/pages/admin/AdminFeedPage'))
const AdminInvestorActivationsPage = lazyPage(() => import('@/pages/admin/AdminInvestorActivationsPage'))
const AdminInvestorCatalogPage = lazyPage(() => import('@/pages/admin/AdminInvestorCatalogPage'))
const AdminOpportunitiesPage = lazyPage(() => import('@/pages/admin/AdminOpportunitiesPage'))
const AdminReportsPage = lazyPage(() => import('@/pages/admin/AdminReportsPage'))
const AdminWithdrawalsPage = lazyPage(() => import('@/pages/admin/AdminWithdrawalsPage'))
const AdminAuditLogsPage = lazyPage(() => import('@/pages/admin/AdminAuditLogsPage'))

/** UX-only gate: the real boundary is the backend, which only accepts an admin-scoped token on
 *  /api/admin/**. Without a stored session there is nothing to call it with, so send to sign-in. */
function AdminPortalGuard() {
  return getStoredSession() ? <Outlet /> : <Navigate to="/login" replace />
}

/** The whole admin site. It shares no routes with the member application: anything that is not the
 *  sign-in page or an admin screen simply redirects into the control panel. */
export function AdminPortalRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        {/* Public and outside the guard on purpose: the person using them is locked out. The reset page
            must also work in a browser that still holds an old session (the emailed link can be opened
            anywhere), and confirming a reset ends every session anyway. */}
        <Route path="/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/reset-password" element={<AdminResetPasswordPage />} />
        <Route element={<AdminPortalGuard />}>
          <Route element={<AdminPortalShell />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailPage />} />
              <Route path="startups" element={<AdminStartupsPage />} />
              <Route path="ideas" element={<AdminIdeasPage />} />
              <Route path="opportunities" element={<AdminOpportunitiesPage />} />
              <Route path="grants" element={<AdminGrantsPage />} />
              <Route path="resources" element={<AdminResourcesPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="feed" element={<AdminFeedPage />} />
              <Route path="investor-activations" element={<AdminInvestorActivationsPage />} />
              <Route path="investor-catalog" element={<AdminInvestorCatalogPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}
