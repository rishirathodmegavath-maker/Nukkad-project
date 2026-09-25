import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

import { GOOGLE_CALLBACK_PATH } from '@/lib/google-auth'
import { lazyPage } from '@/lib/lazyPage'
import { RouteFallback } from '@/components/ui/RouteFallback'

// Every page is its own chunk: opening the app downloads the shell and the page you land on, not all of them.
const LoginPage = lazyPage(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazyPage(() => import('@/pages/auth/SignupPage'))
const ForgotPasswordPage = lazyPage(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazyPage(() => import('@/pages/auth/ResetPasswordPage'))
const GoogleCallbackPage = lazyPage(() => import('@/pages/auth/GoogleCallbackPage'))
const VerifyEmailPage = lazyPage(() => import('@/pages/auth/VerifyEmailPage'))
const OnboardingPage = lazyPage(() => import('@/pages/onboarding/OnboardingPage'))
const HomePage = lazyPage(() => import('@/pages/home/HomePage'))
const SearchResultsPage = lazyPage(() => import('@/pages/search/SearchResultsPage'))
const PeopleListPage = lazyPage(() => import('@/pages/people/PeopleListPage'))
const PersonProfilePage = lazyPage(() => import('@/pages/people/PersonProfilePage'))
const WalletPage = lazyPage(() => import('@/pages/wallet/WalletPage'))
const FounderDashboardPage = lazyPage(() => import('@/pages/dashboard/FounderDashboardPage'))
const IdeasListPage = lazyPage(() => import('@/pages/ideas/IdeasListPage'))
const IdeaDetailPage = lazyPage(() => import('@/pages/ideas/IdeaDetailPage'))
const PostIdeaPage = lazyPage(() => import('@/pages/ideas/PostIdeaPage'))
const StartupsListPage = lazyPage(() => import('@/pages/startups/StartupsListPage'))
const RegisterStartupPage = lazyPage(() => import('@/pages/startups/RegisterStartupPage'))
const StartupDetailPage = lazyPage(() => import('@/pages/startups/StartupDetailPage'))
const ManageStartupPage = lazyPage(() => import('@/pages/startups/ManageStartupPage'))
const IndustriesListPage = lazyPage(() => import('@/pages/industries/IndustriesListPage'))
const IndustryDetailPage = lazyPage(() => import('@/pages/industries/IndustryDetailPage'))
const OpportunitiesListPage = lazyPage(() => import('@/pages/opportunities/OpportunitiesListPage'))
const JobsPage = lazyPage(() => import('@/pages/opportunities/JobsPage'))
const PostOpportunityPage = lazyPage(() => import('@/pages/opportunities/PostOpportunityPage'))
const MyApplicationsPage = lazyPage(() => import('@/pages/opportunities/MyApplicationsPage'))
const PostedByMePage = lazyPage(() => import('@/pages/opportunities/PostedByMePage'))
const OpportunityDetailPage = lazyPage(() => import('@/pages/opportunities/OpportunityDetailPage'))
const OpportunityApplicationsPage = lazyPage(() => import('@/pages/opportunities/OpportunityApplicationsPage'))
const ChaptersListPage = lazyPage(() => import('@/pages/chapters/ChaptersListPage'))
const CreateChapterPage = lazyPage(() => import('@/pages/chapters/CreateChapterPage'))
const ChapterDetailPage = lazyPage(() => import('@/pages/chapters/ChapterDetailPage'))
const InvestorsListPage = lazyPage(() => import('@/pages/investors/InvestorsListPage'))
const InvestorProfileFormPage = lazyPage(() => import('@/pages/investors/InvestorProfileFormPage'))
const InvestorProfilePage = lazyPage(() => import('@/pages/investors/InvestorProfilePage'))
const InvestorCatalogProfilePage = lazyPage(() => import('@/pages/investors/InvestorCatalogProfilePage'))
const FundraiseDetailPage = lazyPage(() => import('@/pages/investors/FundraiseDetailPage'))
const IntroRequestsPage = lazyPage(() => import('@/pages/investors/IntroRequestsPage'))
const FeedPage = lazyPage(() => import('@/pages/feed/FeedPage'))
const PostDetailPage = lazyPage(() => import('@/pages/feed/PostDetailPage'))
const DiscussionsPage = lazyPage(() => import('@/pages/discussions/DiscussionsPage'))
const DiscussionDetailPage = lazyPage(() => import('@/pages/discussions/DiscussionDetailPage'))
const EventsListPage = lazyPage(() => import('@/pages/events/EventsListPage'))
const PostEventPage = lazyPage(() => import('@/pages/events/PostEventPage'))
const EventDetailPage = lazyPage(() => import('@/pages/events/EventDetailPage'))
const NotificationsPage = lazyPage(() => import('@/pages/notifications/NotificationsPage'))
const MessagesPage = lazyPage(() => import('@/pages/messages/MessagesPage'))
const ResourcesPage = lazyPage(() => import('@/pages/resources/ResourcesPage'))
const ResourceDetailPage = lazyPage(() => import('@/pages/resources/ResourceDetailPage'))
const GrantsListPage = lazyPage(() => import('@/pages/grants/GrantsListPage'))
const GrantFormPage = lazyPage(() => import('@/pages/grants/GrantFormPage'))
const GrantDetailPage = lazyPage(() => import('@/pages/grants/GrantDetailPage'))
const SettingsPage = lazyPage(() => import('@/pages/settings/SettingsPage'))
const NotFoundPage = lazyPage(() => import('@/pages/NotFoundPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
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

        {/* Unguarded, not PublicOnlyRoute: an emailed reset link should work even if the clicking
            browser happens to still hold an old session (e.g. a different device/tab than the one
            that's locked out) — confirming a reset revokes every session anyway. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            <Route path="/startups/:id/manage" element={<ManageStartupPage />} />

            <Route path="/industries" element={<IndustriesListPage />} />
            <Route path="/industries/:slug" element={<IndustryDetailPage />} />

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
            <Route path="/investors/catalog/:id" element={<InvestorCatalogProfilePage />} />
            <Route path="/investors/:id" element={<InvestorProfilePage />} />

            <Route path="/feed" element={<FeedPage />} />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/feed/:postId" element={<PostDetailPage />} />

            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<PostEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />

            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />

            {/* Programs are curated on the Startup Programs shelf of the Resources library. */}
            <Route path="/programs" element={<Navigate to="/resources?category=programs" replace />} />
            <Route path="/spark" element={<Navigate to="/resources?category=programs&q=spark" replace />} />
            <Route path="/ignite" element={<Navigate to="/resources?category=programs&q=ignite" replace />} />

            <Route path="/grants" element={<GrantsListPage />} />
            <Route path="/grants/new" element={<GrantFormPage />} />
            <Route path="/grants/:id/edit" element={<GrantFormPage />} />
            <Route path="/grants/:id" element={<GrantDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
