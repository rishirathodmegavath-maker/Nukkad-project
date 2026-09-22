import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { getStoredSession } from '@/lib/session'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminForgotPasswordPage from '@/pages/admin/AdminForgotPasswordPage'
import AdminResetPasswordPage from '@/pages/admin/AdminResetPasswordPage'
import { AdminPortalShell } from '@/pages/admin/AdminPortalShell'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminActivityPage from '@/pages/admin/AdminActivityPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage'
import AdminStartupsPage from '@/pages/admin/AdminStartupsPage'
import AdminIdeasPage from '@/pages/admin/AdminIdeasPage'
import AdminGrantsPage from '@/pages/admin/AdminGrantsPage'
import AdminResourcesPage from '@/pages/admin/AdminResourcesPage'
import AdminFeedPage from '@/pages/admin/AdminFeedPage'
import AdminInvestorActivationsPage from '@/pages/admin/AdminInvestorActivationsPage'
import AdminInvestorCatalogPage from '@/pages/admin/AdminInvestorCatalogPage'
import AdminOpportunitiesPage from '@/pages/admin/AdminOpportunitiesPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'
import AdminWithdrawalsPage from '@/pages/admin/AdminWithdrawalsPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'

/** UX-only gate: the real boundary is the backend, which only accepts an admin-scoped token on
 *  /api/admin/**. Without a stored session there is nothing to call it with, so send to sign-in. */
function AdminPortalGuard() {
  return getStoredSession() ? <Outlet /> : <Navigate to="/login" replace />
}

/** The whole admin site. It shares no routes with the member application: anything that is not the
 *  sign-in page or an admin screen simply redirects into the control panel. */
export function AdminPortalRoutes() {
  return (
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
  )
}
