import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Lightbulb,
  Rocket,
  Briefcase,
  Users,
  ArrowRight,
  CalendarDays,
  Sparkles,
  MapPin,
  Plus,
  Compass,
  ChevronRight,
  Rss,
  type LucideIcon,
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { listIdeas, listRecommendedIdeas } from '@/services/ideas.service'
import { listStartups } from '@/services/startups.service'
import { listOpportunities, listRecommendedOpportunities } from '@/services/opportunities.service'
import { listEvents } from '@/services/events.service'
import { getChapter } from '@/services/chapters.service'
import { listFeed } from '@/services/feed.service'
import { IdeaCard } from '@/components/domain/IdeaCard'
import { StartupCard } from '@/components/domain/StartupCard'
import { EventCard } from '@/components/domain/EventCard'
import { SuggestedForYou } from '@/components/domain/SuggestedForYou'
import { MatchReasons } from '@/components/domain/MatchReasons'
import { PostCard } from '@/components/domain/PostCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Tabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { formatRelativeTime } from '@/lib/utils'
import type { OpportunityMatch } from '@/types'

/* -------------------------------------------------------------------------- */
/* Sub-components for Home Page                                               */
/* -------------------------------------------------------------------------- */

/** A count with a label that links to the page it counts. Reads as a link: white surface, brand hover, chevron. */
function StatChip({ to, icon: Icon, value, label }: { to: string; icon: LucideIcon; value: number; label: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-fg-brand"
    >
      <Icon className="size-3.5 text-fg-muted group-hover:text-fg-brand" aria-hidden="true" />
      <span>{value}</span>
      <span className="font-medium text-fg-secondary">{label}</span>
      <ChevronRight className="size-3 text-fg-muted" aria-hidden="true" />
    </Link>
  )
}

function HomeOpportunityRow({ match }: { match: OpportunityMatch }) {
  const opp = match.opportunity

  return (
    <Link
      to={`/opportunities/${opp.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-xl border border-border/80 bg-surface hover:border-border-strong hover:bg-surface-hover/50 transition-all shadow-2xs"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge tone="neutral" className="text-xs font-semibold">
            {opp.type}
          </Badge>
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md border border-brand-200/50 dark:border-brand-800/40">
            {opp.workMode}
          </span>
          {opp.compensation && (
            <span className="text-xs font-semibold text-fg-secondary bg-surface-sunken px-2 py-0.5 rounded-md border border-border/60">
              {opp.compensation}
            </span>
          )}
          <span className="text-xs text-fg-muted font-medium ml-auto sm:ml-0">
            {formatRelativeTime(opp.createdAt)}
          </span>
        </div>

        <h3 className="font-bold text-fg text-sm sm:text-base group-hover:underline truncate">
          {opp.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted mt-1">
          <span className="font-medium text-fg-secondary flex items-center gap-1">
            <Briefcase className="size-3 text-fg-muted shrink-0" />
            {opp.organizationName}
          </span>
          {opp.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-fg-muted shrink-0" />
              {opp.location}
            </span>
          )}
        </div>

        {match.reasons && match.reasons.length > 0 && (
          <div className="mt-2.5">
            <MatchReasons reasons={match.reasons.slice(0, 2)} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end sm:justify-center shrink-0">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-fg bg-surface-sunken group-hover:bg-brand-600 group-hover:text-white px-3 py-1.5 rounded-lg border border-border/80 group-hover:border-brand-600 transition-colors shadow-2xs">
          View details
          <ChevronRight className="size-3.5" />
        </span>
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Main HomePage Component                                                    */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const { data: currentUser } = useCurrentUser()
  const [discoveryTab, setDiscoveryTab] = useState<'ideas' | 'startups'>('ideas')

  // Real Queries
  const ideasQuery = useQuery({ queryKey: ['ideas', 'home'], queryFn: () => listIdeas() })
  const recommendedIdeasQuery = useQuery({
    queryKey: ['ideas', 'recommended-home'],
    queryFn: () => listRecommendedIdeas(3),
  })
  const startupsQuery = useQuery({ queryKey: ['startups', 'home'], queryFn: () => listStartups() })
  const recommendedOppsQuery = useQuery({
    queryKey: ['opportunities', 'recommended-home'],
    queryFn: () => listRecommendedOpportunities(4),
  })
  const allOppsQuery = useQuery({
    queryKey: ['opportunities', 'home'],
    queryFn: () => listOpportunities(),
    enabled: !recommendedOppsQuery.data || recommendedOppsQuery.data.length === 0,
  })
  const eventsQuery = useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => listEvents({ upcoming: true }) })
  const feedQuery = useQuery({ queryKey: ['feed', 'home'], queryFn: () => listFeed(undefined, 4) })
  const chapterQuery = useQuery({
    queryKey: ['chapter', currentUser?.chapterId],
    queryFn: () => getChapter(currentUser!.chapterId!),
    enabled: !!currentUser?.chapterId,
  })

  // Recommended ideas (real TF-IDF matching — same engine as the Ideas page), falling back to a
  // plain recent slice only when there's nothing to recommend yet.
  const matchedIdeas = useMemo(() => {
    if (recommendedIdeasQuery.data && recommendedIdeasQuery.data.length > 0) {
      return recommendedIdeasQuery.data.map((match) => ({ idea: match.idea, reasons: match.reasons }))
    }
    if (!ideasQuery.data) return []
    return ideasQuery.data.slice(0, 3).map((idea) => ({ idea, reasons: [] as string[] }))
  }, [recommendedIdeasQuery.data, ideasQuery.data])

  // Featured startups (raising first, then early traction)
  const featuredStartups = useMemo(() => {
    if (!startupsQuery.data) return []
    const raising = startupsQuery.data.filter((s) => s.isRaising)
    const others = startupsQuery.data.filter((s) => !s.isRaising)
    return [...raising, ...others].slice(0, 3)
  }, [startupsQuery.data])

  // Effective opportunities list
  const effectiveOpportunities: OpportunityMatch[] = useMemo(() => {
    if (recommendedOppsQuery.data && recommendedOppsQuery.data.length > 0) {
      return recommendedOppsQuery.data.slice(0, 4)
    }
    if (allOppsQuery.data && allOppsQuery.data.length > 0) {
      return allOppsQuery.data.slice(0, 4).map((opp) => ({
        opportunity: opp,
        score: 1,
        matchLabel: 'Good match' as const,
        reasons: [],
      }))
    }
    return []
  }, [recommendedOppsQuery.data, allOppsQuery.data])

  const firstName = currentUser?.name?.split(' ')[0] || 'Builder'
  const upcomingEvents = eventsQuery.data?.slice(0, 2) || []

  return (
    <div className="flex flex-col gap-7 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Personalized Briefing Hero & Contextual Action Bar             */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                Welcome back, {firstName}
              </h1>
              <span className="text-lg">👋</span>
            </div>
            <p className="text-sm text-fg-muted mt-1 leading-relaxed">
              Here’s what’s relevant and happening across your BuildAdda ecosystem today.
            </p>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Link to="/ideas/new" className={buttonClasses({ size: 'sm' })}>
              <Plus className="size-3.5" aria-hidden="true" />
              Post an idea
            </Link>

            {currentUser && <StatChip to={`/people/${currentUser.id}`} icon={Users} value={currentUser.connectionsCount ?? 0} label="connections" />}
            <StatChip to="/opportunities" icon={Briefcase} value={allOppsQuery.data?.length ?? recommendedOppsQuery.data?.length ?? 0} label="roles" />
            <StatChip to="/events" icon={CalendarDays} value={eventsQuery.data?.length ?? 0} label="events" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Main Balanced 2-Column Desktop Grid / Reflowing Mobile Linear   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* ============================================================== */}
        {/* Left / Primary Column (lg:col-span-8)                          */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 flex flex-col gap-8 min-w-0">
          {/* ------------------------------------------------------------ */}
          {/* Section A: Curated Discovery Hub (Ideas & Startups)          */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
              <Tabs
                label="Discover"
                className="border-b-0"
                value={discoveryTab}
                onChange={(k) => setDiscoveryTab(k as 'ideas' | 'startups')}
                items={[
                  { key: 'ideas', label: 'Ideas to Build', count: matchedIdeas.length > 0 ? ideasQuery.data?.length ?? 0 : undefined },
                  { key: 'startups', label: 'Startups in Motion', count: featuredStartups.length > 0 ? startupsQuery.data?.length ?? 0 : undefined },
                ]}
              />

              <Link
                to={discoveryTab === 'ideas' ? '/ideas' : '/startups'}
                className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:underline self-end sm:self-auto"
              >
                <span>Explore all {discoveryTab === 'ideas' ? 'ideas' : 'startups'}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Tab Body: Ideas */}
            {discoveryTab === 'ideas' && (
              <div>
                {ideasQuery.isLoading ? (
                  <CardSkeletonGrid count={3} />
                ) : matchedIdeas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {matchedIdeas.map((match) => (
                      <IdeaCard key={match.idea.id} idea={match.idea} reasons={match.reasons} />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <Lightbulb className="size-8 text-fg-muted mx-auto mb-2" />
                    <p className="text-sm font-semibold text-fg">No ideas posted yet</p>
                    <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
                      Be the first builder to post a concept and recruit collaborators.
                    </p>
                    <Link to="/ideas/new" className={buttonClasses({ size: 'sm', className: 'mt-4' })}>
                      <Plus className="size-3.5" aria-hidden="true" />
                      Post an idea
                    </Link>
                  </Card>
                )}
              </div>
            )}

            {/* Tab Body: Startups */}
            {discoveryTab === 'startups' && (
              <div>
                {startupsQuery.isLoading ? (
                  <CardSkeletonGrid count={3} />
                ) : featuredStartups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {featuredStartups.map((startup) => (
                      <StartupCard key={startup.id} startup={startup} />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <Rocket className="size-8 text-fg-muted mx-auto mb-2" />
                    <p className="text-sm font-semibold text-fg">No startups listed yet</p>
                    <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
                      Startups graduate from validated ideas on BuildAdda.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </section>

          {/* ------------------------------------------------------------ */}
          {/* Section B: Latest from BuildAdda (Primary Community Feed)       */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/50">
                  <Rss className="size-3.5" />
                </div>
                <h2 className="text-base font-bold text-fg">Latest from BuildAdda</h2>
              </div>
              <Link
                to="/feed"
                className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:underline group"
              >
                <span>View Feed</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {feedQuery.isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-border/80 bg-surface flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-surface-sunken animate-pulse" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3.5 w-28 rounded-md bg-surface-sunken animate-pulse" />
                        <div className="h-2.5 w-16 rounded-md bg-surface-sunken animate-pulse" />
                      </div>
                    </div>
                    <div className="h-14 w-full rounded-lg bg-surface-sunken/60 animate-pulse" />
                    <div className="h-8 w-full rounded-lg bg-surface-sunken/40 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : feedQuery.isError ? (
              <Card className="p-6 text-center border border-border/80 shadow-xs">
                <p className="text-sm font-semibold text-fg">Couldn’t load the feed right now.</p>
                <p className="text-xs text-fg-muted mt-1 mb-3">Please try again to see the latest community posts.</p>
                <Button size="sm" variant="secondary" onClick={() => feedQuery.refetch()}>
                  Retry
                </Button>
              </Card>
            ) : feedQuery.data && feedQuery.data.length > 0 ? (
              <div className="flex flex-col gap-4">
                {feedQuery.data.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center border border-border/80 shadow-xs">
                <Sparkles className="size-8 text-fg-muted mx-auto mb-2" />
                <p className="text-sm font-semibold text-fg">Nothing new yet</p>
                <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto mb-3">
                  Be the first to share something with the community.
                </p>
                <Link to="/feed" className={buttonClasses({ size: 'sm' })}>
                  Go to feed
                </Link>
              </Card>
            )}
          </section>

          {/* ------------------------------------------------------------ */}
          {/* Section C: Opportunities & Roles (Compact & High Density)    */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-fg">Opportunities for you</h2>
                {currentUser?.skills && currentUser.skills.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-fg-muted font-medium bg-surface-sunken px-2 py-0.5 rounded-md border border-border/60">
                    <Sparkles className="size-3 text-accent-500" />
                    Skill matched
                  </span>
                )}
              </div>
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:underline"
              >
                <span>View all roles</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {recommendedOppsQuery.isLoading || (allOppsQuery.isLoading && !recommendedOppsQuery.data) ? (
              <div className="flex flex-col gap-3">
                <div className="h-20 w-full rounded-xl bg-surface-sunken/60 animate-pulse border border-border/70" />
                <div className="h-20 w-full rounded-xl bg-surface-sunken/60 animate-pulse border border-border/70" />
              </div>
            ) : effectiveOpportunities.length > 0 ? (
              <div className="flex flex-col gap-3">
                {effectiveOpportunities.map((match) => (
                  <HomeOpportunityRow key={match.opportunity.id} match={match} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <Briefcase className="size-8 text-fg-muted mx-auto mb-2" />
                <p className="text-sm font-semibold text-fg">No open opportunities right now</p>
                <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
                  New roles for co-founders, founding engineers, and interns will appear here.
                </p>
              </Card>
            )}
          </section>
        </div>

        {/* ============================================================== */}
        {/* Right Column / Community & Network Pulse (lg:col-span-4)       */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
          {/* ------------------------------------------------------------ */}
          {/* Section D: People You Should Know (Network Pulse)            */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <h2 className="text-sm font-bold text-fg flex items-center gap-1.5">
                <Users className="size-4 text-fg-muted" />
                <span>People you may know</span>
              </h2>
              <Link
                to="/people"
                className="text-xs font-semibold text-fg hover:underline"
              >
                Explore
              </Link>
            </div>

            <Card padding="none" className="overflow-hidden border border-border/80 shadow-2xs">
              <div className="p-3">
                <SuggestedForYou limit={4} showHeader={false} />
              </div>
            </Card>
          </section>

          {/* ------------------------------------------------------------ */}
          {/* Section E: Upcoming Events & Meetups                         */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <h2 className="text-sm font-bold text-fg flex items-center gap-1.5">
                <CalendarDays className="size-4 text-fg-muted" />
                <span>Upcoming meetups</span>
              </h2>
              <Link
                to="/events"
                className="text-xs font-semibold text-fg hover:underline"
              >
                View all
              </Link>
            </div>

            {eventsQuery.isLoading ? (
              <div className="h-28 w-full rounded-xl bg-surface-sunken/60 animate-pulse border border-border/70" />
            ) : upcomingEvents.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-xs font-semibold text-fg">No upcoming meetups scheduled</p>
                <p className="text-xs text-fg-muted mt-0.5 mb-3">Host a meetup for your local ecosystem.</p>
                <Link to="/events/new" className={buttonClasses({ size: 'sm', variant: 'secondary', className: 'w-full' })}>
                  Host an event
                </Link>
              </Card>
            )}
          </section>

          {/* ------------------------------------------------------------ */}
          {/* Section F: Local Chapter Hub Summary                         */}
          {/* ------------------------------------------------------------ */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <h2 className="text-sm font-bold text-fg flex items-center gap-1.5">
                <Compass className="size-4 text-fg-muted" />
                <span>Local chapter</span>
              </h2>
              <Link
                to="/chapters"
                className="text-xs font-semibold text-fg hover:underline"
              >
                All chapters
              </Link>
            </div>

            {chapterQuery.data ? (
              <Card className="flex flex-col gap-2.5 p-4 border border-border/80 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/chapters/${chapterQuery.data.id}`}
                      className="font-bold text-sm text-fg hover:underline truncate block"
                    >
                      {chapterQuery.data.name}
                    </Link>
                    {(chapterQuery.data.city || chapterQuery.data.country) && (
                      <p className="text-xs text-fg-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 text-fg-muted/80 shrink-0" />
                        {[chapterQuery.data.city, chapterQuery.data.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-fg-brand bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 shrink-0">
                    Member
                  </span>
                </div>

                {chapterQuery.data.description && (
                  <p className="text-xs text-fg-secondary line-clamp-2 leading-relaxed">
                    {chapterQuery.data.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-fg-muted">
                  <span>{chapterQuery.data.eventCount ?? 0} chapter meetups</span>
                  <Link
                    to={`/chapters/${chapterQuery.data.id}`}
                    className="font-semibold text-fg hover:underline"
                  >
                    Open hub →
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className="p-4 text-center border border-border/80 shadow-2xs">
                <p className="text-xs font-semibold text-fg">Connect with your city</p>
                <p className="text-xs text-fg-muted mt-0.5 mb-3">
                  Join a local chapter to access localized events, resources, and builders.
                </p>
                <Link to="/chapters" className={buttonClasses({ size: 'sm', variant: 'secondary', className: 'w-full' })}>
                  Find your chapter
                </Link>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
