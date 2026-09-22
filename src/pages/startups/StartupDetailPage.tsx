import { useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Sparkles, Users } from 'lucide-react'
import {
  getStartup,
  toggleFollowStartup,
  getStartupMembers,
  getMyStartupMembership,
  getStartupJoinRequests,
  getStartupRoles,
} from '@/services/startups.service'
import { getEventsForStartup } from '@/services/events.service'
import { getCurrentUserId } from '@/services/users.service'
import { useStartupOpenPositions } from '@/hooks/useStartupOpenPositions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { JoinStartupModal } from '@/components/domain/JoinStartupModal'
import { DeleteStartupModal } from '@/components/startup/manage/DeleteStartupModal'
import { managePath, type SectionKey } from '@/components/startup/manage/manage-model'
import { StartupProfileHeader } from '@/components/startup/StartupProfileHeader'
import { StartupMetricStrip } from '@/components/startup/StartupMetricStrip'
import { StartupOverview } from '@/components/startup/StartupOverview'
import { StartupProblemTab, StartupSolutionTab } from '@/components/startup/StartupNarrativeTabs'
import { StartupTractionTab } from '@/components/startup/StartupTractionTab'
import { StartupTeamTab } from '@/components/startup/StartupTeamTab'
import { StartupFundraisingTab } from '@/components/startup/StartupFundraisingTab'
import { StartupUpdatesTab } from '@/components/startup/StartupUpdatesTab'
import { StartupEventsTab } from '@/components/startup/StartupEventsTab'
import { toast } from '@/store/toast.store'

const TAB_KEYS = ['overview', 'problem', 'solution', 'traction', 'team', 'fundraising', 'updates', 'events'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  problem: 'Problem',
  solution: 'Solution',
  traction: 'Traction',
  team: 'Team',
  fundraising: 'Fundraising',
  updates: 'Updates',
  events: 'Events',
}

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value)
}

/** A startup's public profile: header and real counts on top, then the tab the visitor chose (kept in the URL as ?tab=). */
export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const tabParam = searchParams.get('tab')
  const tab: TabKey = isTabKey(tabParam) ? tabParam : 'overview'
  function selectTab(key: string) {
    setSearchParams(key === 'overview' ? {} : { tab: key }, { replace: true })
  }
  /** Editing happens on the management page, one section at a time. */
  const manage = (section?: SectionKey) => navigate(managePath(id!, section))

  const { data: startup, isLoading, isError, refetch } = useQuery({
    queryKey: ['startup', id],
    // getStartup answers "nothing" for a startup that is missing or not visible to this viewer; a query may not
    // resolve to undefined, so that becomes an error and the page shows its "couldn't load" state.
    queryFn: async () => {
      const found = await getStartup(id!)
      if (!found) throw new Error('Startup not found')
      return found
    },
    enabled: !!id,
  })

  const membersQuery = useQuery({
    queryKey: ['startup', id, 'members'],
    queryFn: () => getStartupMembers(id!),
    enabled: !!id,
  })

  const myMembershipQuery = useQuery({
    queryKey: ['startup', id, 'my-membership'],
    // Someone with no link to the startup has no membership: that is an answer (null), not a missing result.
    queryFn: async () => (await getMyStartupMembership(id!)) ?? null,
    enabled: !!id,
  })

  // Derived from /my-membership (JWT-scoped server-side), not by cross-referencing the separately-cached
  // currentUser + members list, which avoids a stale-currentUser-cache mismatch.
  const isFounder = myMembershipQuery.data?.isFounder ?? false
  // Founder or Admin: unlocks edit-startup / manage-team / post-jobs / edit-fundraising. Delete stays founder-only.
  const canManage = myMembershipQuery.data?.canManage ?? false

  const joinRequestsQuery = useQuery({
    queryKey: ['startup', id, 'join-requests'],
    queryFn: () => getStartupJoinRequests(id!),
    enabled: !!id && canManage,
  })

  const eventsQuery = useQuery({
    queryKey: ['startup', id, 'events'],
    queryFn: () => getEventsForStartup(id!),
    enabled: !!id,
  })

  const openPositions = useStartupOpenPositions(id, canManage)

  // Only the join-request role picker reads these, so they are fetched when that dialog is opened.
  const rolesQuery = useQuery({
    queryKey: ['startup', id, 'roles'],
    queryFn: () => getStartupRoles(id!),
    enabled: !!id && joinModalOpen,
  })

  const followMutation = useMutation({
    mutationFn: () => toggleFollowStartup(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['startup', id], updated)
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success(updated.isFollowing ? `Following ${updated.name}` : 'Unfollowed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your follow'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !startup) {
    return <ErrorState title="Couldn’t load this startup" onRetry={refetch} />
  }

  const membership = myMembershipQuery.data ?? undefined
  const isActiveMember = membership?.status === 'ACTIVE'
  const members = membersQuery.data
  const pendingRequests = joinRequestsQuery.data ?? []
  const myUserId = getCurrentUserId()
  // Contact goes to a founder other than the viewer, through the normal messaging flow.
  const contactUserId = members?.find((m) => m.isFounder && m.userId !== myUserId)?.userId

  const tabItems: TabItem[] = TAB_KEYS.map((key) => ({
    key,
    label: TAB_LABELS[key],
    ...(key === 'team' && members ? { count: members.length } : {}),
    ...(key === 'events' && eventsQuery.data ? { count: eventsQuery.data.length } : {}),
  }))

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/startups" className="transition-colors hover:text-fg">
          Startups
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="max-w-sm truncate text-fg">{startup.name}</span>
      </nav>

      {canManage && startup.moderationStatus === 'REJECTED' && (
        <Card className="flex items-center gap-3 border border-danger-500/30 bg-danger-500/5">
          <Badge tone="danger">Not approved</Badge>
          <p className="text-sm text-fg-secondary">{startup.rejectionReason ?? 'This startup was not approved.'}</p>
        </Card>
      )}

      <StartupProfileHeader
        startup={startup}
        canManage={canManage}
        isFounder={isFounder}
        membership={membership}
        contactUserId={contactUserId}
        followPending={followMutation.isPending}
        onFollow={() => followMutation.mutate()}
        onManage={() => manage()}
        onJoin={() => setJoinModalOpen(true)}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      <StartupMetricStrip
        followers={startup.followerCount}
        teamMembers={members?.length}
        openRoles={openPositions.isLoading ? undefined : openPositions.positions.length}
        events={eventsQuery.isLoading ? undefined : (eventsQuery.data?.length ?? 0)}
      />

      {canManage && pendingRequests.length > 0 && (
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3 border-brand-500/30 bg-brand-500/5 shadow-none">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-fg-brand">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-fg [overflow-wrap:anywhere]">
              {pendingRequests.length} {pendingRequests.length === 1 ? 'person wants' : 'people want'} to join {startup.name}
            </p>
          </div>
          <Button size="sm" onClick={() => selectTab('team')}>
            Review requests
          </Button>
        </Card>
      )}

      {canManage && startup.profileCompletionPercent < 100 && (
        <Card padding="sm" className="flex flex-col gap-3 border-brand-500/30 bg-brand-500/5 shadow-none sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-fg-brand">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Your profile is {startup.profileCompletionPercent}% complete</p>
              <ProgressBar value={startup.profileCompletionPercent} label="Profile completion" className="mt-2 max-w-sm" />
            </div>
          </div>
          <Button size="sm" onClick={() => manage('basics')} className="shrink-0">
            Complete profile
          </Button>
        </Card>
      )}

      <div>
        <Tabs label="Startup profile" items={tabItems} value={tab} onChange={selectTab} />
        <div role="tabpanel" aria-label={TAB_LABELS[tab]} className="pt-5">
          {tab === 'overview' && (
            <StartupOverview
              startup={startup}
              canManage={canManage}
              onEdit={() => manage('basics')}
              positions={openPositions.positions}
              positionsLoading={openPositions.isLoading}
              myUserId={openPositions.myUserId}
            />
          )}
          {tab === 'problem' && <StartupProblemTab startup={startup} canManage={canManage} onEdit={() => manage('story')} />}
          {tab === 'solution' && <StartupSolutionTab startup={startup} canManage={canManage} onEdit={() => manage('story')} />}
          {tab === 'traction' && <StartupTractionTab startup={startup} canManage={canManage} onEdit={() => manage('traction')} />}
          {tab === 'team' && (
            <StartupTeamTab
              startup={startup}
              members={members}
              membersLoading={membersQuery.isLoading}
              canManage={canManage}
              isFounder={isFounder}
              membership={membership}
              pendingRequests={pendingRequests}
            />
          )}
          {tab === 'fundraising' && <StartupFundraisingTab startup={startup} canManage={canManage} onManage={manage} />}
          {tab === 'updates' && <StartupUpdatesTab startupId={startup.id} canPost={isActiveMember} />}
          {tab === 'events' && (
            <StartupEventsTab events={eventsQuery.data} loading={eventsQuery.isLoading} error={eventsQuery.isError} onRetry={() => eventsQuery.refetch()} canManage={canManage} onManage={manage} />
          )}
        </div>
      </div>

      <JoinStartupModal
        startupId={startup.id}
        startupName={startup.name}
        roles={rolesQuery.data ?? []}
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
      {isFounder && <DeleteStartupModal startup={startup} open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} />}
    </div>
  )
}
