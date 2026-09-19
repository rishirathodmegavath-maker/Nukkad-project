import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import { AppShell } from '@/components/layout/AppShell'

import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import GoogleCallbackPage from '@/pages/auth/GoogleCallbackPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import { GOOGLE_CALLBACK_PATH } from '@/lib/google-auth'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'

import HomePage from '@/pages/home/HomePage'
import SearchResultsPage from '@/pages/search/SearchResultsPage'
import PeopleListPage from '@/pages/people/PeopleListPage'
import PersonProfilePage from '@/pages/people/PersonProfilePage'
import WalletPage from '@/pages/wallet/WalletPage'
import FounderDashboardPage from '@/pages/dashboard/FounderDashboardPage'
import IdeasListPage from '@/pages/ideas/IdeasListPage'
import IdeaDetailPage from '@/pages/ideas/IdeaDetailPage'
import PostIdeaPage from '@/pages/ideas/PostIdeaPage'
import StartupsListPage from '@/pages/startups/StartupsListPage'
import RegisterStartupPage from '@/pages/startups/RegisterStartupPage'
import StartupDetailPage from '@/pages/startups/StartupDetailPage'
import OpportunitiesListPage from '@/pages/opportunities/OpportunitiesListPage'
import PostOpportunityPage from '@/pages/opportunities/PostOpportunityPage'
import MyApplicationsPage from '@/pages/opportunities/MyApplicationsPage'
import PostedByMePage from '@/pages/opportunities/PostedByMePage'
import OpportunityDetailPage from '@/pages/opportunities/OpportunityDetailPage'
import OpportunityApplicationsPage from '@/pages/opportunities/OpportunityApplicationsPage'
import ChaptersListPage from '@/pages/chapters/ChaptersListPage'
import CreateChapterPage from '@/pages/chapters/CreateChapterPage'
import ChapterDetailPage from '@/pages/chapters/ChapterDetailPage'
import InvestorsListPage from '@/pages/investors/InvestorsListPage'
import InvestorProfileFormPage from '@/pages/investors/InvestorProfileFormPage'
import InvestorProfilePage from '@/pages/investors/InvestorProfilePage'
import FundraiseDetailPage from '@/pages/investors/FundraiseDetailPage'
import IntroRequestsPage from '@/pages/investors/IntroRequestsPage'
import FeedPage from '@/pages/feed/FeedPage'
import PostDetailPage from '@/pages/feed/PostDetailPage'
import EventsListPage from '@/pages/events/EventsListPage'
import PostEventPage from '@/pages/events/PostEventPage'
import EventDetailPage from '@/pages/events/EventDetailPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import MessagesPage from '@/pages/messages/MessagesPage'
import ResourcesPage from '@/pages/resources/ResourcesPage'
import ResourceDetailPage from '@/pages/resources/ResourceDetailPage'
import GrantsListPage from '@/pages/grants/GrantsListPage'
import GrantFormPage from '@/pages/grants/GrantFormPage'
import GrantDetailPage from '@/pages/grants/GrantDetailPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage'
import AdminStartupsPage from '@/pages/admin/AdminStartupsPage'
import AdminIdeasPage from '@/pages/admin/AdminIdeasPage'
import AdminGrantsPage from '@/pages/admin/AdminGrantsPage'
import AdminFeedPage from '@/pages/admin/AdminFeedPage'
import AdminInvestorActivationsPage from '@/pages/admin/AdminInvestorActivationsPage'
import AdminOpportunitiesPage from '@/pages/admin/AdminOpportunitiesPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'
import AdminWithdrawalsPage from '@/pages/admin/AdminWithdrawalsPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Unguarded: this is the landing page for Google's OAuth redirect, reached mid-login
          before any session exists — neither PublicOnlyRoute nor ProtectedRoute apply. */}
      <Route path={GOOGLE_CALLBACK_PATH} element={<GoogleCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />

          <Route path="/people" element={<PeopleListPage />} />
          <Route path="/people/:id" element={<PersonProfilePage />} />

          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/dashboard" element={<FounderDashboardPage />} />

          <Route path="/ideas" element={<IdeasListPage />} />
          <Route path="/ideas/new" element={<PostIdeaPage />} />
          <Route path="/ideas/:id" element={<IdeaDetailPage />} />

          <Route path="/startups" element={<StartupsListPage />} />
          <Route path="/startups/new" element={<RegisterStartupPage />} />
          <Route path="/startups/:id" element={<StartupDetailPage />} />

          <Route path="/opportunities" element={<OpportunitiesListPage />} />
          <Route path="/opportunities/new" element={<PostOpportunityPage />} />
          <Route path="/opportunities/mine" element={<MyApplicationsPage />} />
          <Route path="/opportunities/posted" element={<PostedByMePage />} />
          <Route path="/opportunities/:id/edit" element={<PostOpportunityPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/opportunities/:id/applications" element={<OpportunityApplicationsPage />} />

          <Route path="/chapters" element={<ChaptersListPage />} />
          <Route path="/chapters/new" element={<CreateChapterPage />} />
          <Route path="/chapters/:id" element={<ChapterDetailPage />} />

          <Route path="/investors" element={<InvestorsListPage />} />
          <Route path="/investors/activate" element={<InvestorProfileFormPage />} />
          <Route path="/investors/requests" element={<IntroRequestsPage />} />
          <Route path="/investors/fundraises/:id" element={<FundraiseDetailPage />} />
          <Route path="/investors/:id" element={<InvestorProfilePage />} />

          <Route path="/feed" element={<FeedPage />} />
          <Route path="/feed/:postId" element={<PostDetailPage />} />

          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/new" element={<PostEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />

          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />

          <Route path="/grants" element={<GrantsListPage />} />
          <Route path="/grants/new" element={<GrantFormPage />} />
          <Route path="/grants/:id/edit" element={<GrantFormPage />} />
          <Route path="/grants/:id" element={<GrantDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* UX-only gate — the real boundary is the backend's ROLE_ADMIN check on every
              /api/admin/** call (see SecurityConfig). A non-admin who reaches this route
              client-side is redirected before any admin API is ever called. */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailPage />} />
              <Route path="startups" element={<AdminStartupsPage />} />
              <Route path="ideas" element={<AdminIdeasPage />} />
              <Route path="opportunities" element={<AdminOpportunitiesPage />} />
              <Route path="grants" element={<AdminGrantsPage />} />
              <Route path="feed" element={<AdminFeedPage />} />
              <Route path="investor-activations" element={<AdminInvestorActivationsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
