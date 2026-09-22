import { Link } from 'react-router-dom'
import { Briefcase, Sparkles, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ModerationBadge } from '@/components/domain/ModerationBadge'
import { StartupMaterialsSection } from '@/components/domain/StartupMaterialsSection'
import { ExpandableText, Field } from '@/components/startup/ProfileParts'
import type { Opportunity, Startup } from '@/types'

interface StartupOverviewProps {
  startup: Startup
  canManage: boolean
  onEdit: () => void
  positions: Opportunity[]
  positionsLoading: boolean
  /** The viewer's own id: a manager's own posting says "View" instead of "Apply Now". */
  myUserId?: string
}

function OpenRolesCard({ startupId, canManage, positions, loading, myUserId }: { startupId: string; canManage: boolean; positions: Opportunity[]; loading: boolean; myUserId?: string }) {
  return (
    <SectionCard
      title="Open roles"
      icon={<Briefcase className="size-4" />}
      action={
        canManage && positions.length > 0 ? (
          <Link to={`/opportunities/new?startupId=${startupId}`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
            Post a role
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : positions.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {positions.map((opp) => (
            <li key={opp.id} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-border/70 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-fg">{opp.title}</p>
                  <ModerationBadge status={opp.moderationStatus} />
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-muted">
                  {[opp.type, opp.location, opp.workMode].filter(Boolean).join(' · ')}
                </p>
                {opp.moderationStatus === 'PENDING' && <p className="mt-0.5 text-xs text-fg-muted">Only you can see this until an admin approves it.</p>}
              </div>
              <Link to={`/opportunities/${opp.id}`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
                {opp.postedByUserId === myUserId ? 'View' : 'Apply'}
              </Link>
            </li>
          ))}
        </ul>
      ) : canManage ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-fg-muted">No open roles yet. Post an opportunity to start hiring through this startup.</p>
          <Link to={`/opportunities/new?startupId=${startupId}`} className={buttonClasses({ size: 'sm' })}>
            Post an opportunity
          </Link>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">No open roles right now. Follow this startup to hear when they’re hiring.</p>
      )}
    </SectionCard>
  )
}

/** Everything about the startup at a glance: the story in short, what they need, and where to act (roles, materials, events). */
export function StartupOverview({ startup, canManage, onEdit, positions, positionsLoading, myUserId }: StartupOverviewProps) {
  const keywords = startup.keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const hasStory = [startup.whatBuilding, startup.problem, startup.solution, startup.targetCustomer, startup.businessModel].some((t) => t.trim())

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        {!hasStory ? (
          <EmptyState
            as="h3"
            className="py-12"
            icon={<Sparkles className="size-5" />}
            title="No details added yet"
            description={canManage ? 'Describe what you’re building, the problem and your solution so people understand this startup.' : 'The founders haven’t filled in the details yet.'}
            action={
              canManage ? (
                <Button size="sm" onClick={onEdit}>
                  Complete profile
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {startup.whatBuilding.trim() && (
              <SectionCard title="About">
                <ExpandableText text={startup.whatBuilding.trim()} />
              </SectionCard>
            )}
            {(startup.problem.trim() || startup.solution.trim()) && (
              <div className="grid gap-4 md:grid-cols-2">
                {startup.problem.trim() && (
                  <SectionCard title="Problem" className="min-w-0">
                    <ExpandableText text={startup.problem.trim()} />
                  </SectionCard>
                )}
                {startup.solution.trim() && (
                  <SectionCard title="Solution" className="min-w-0">
                    <ExpandableText text={startup.solution.trim()} />
                  </SectionCard>
                )}
              </div>
            )}
            {(startup.targetCustomer.trim() || startup.businessModel.trim()) && (
              <SectionCard title="Customers & business model">
                <div className="grid gap-5 sm:grid-cols-2">
                  {startup.targetCustomer.trim() && (
                    <Field label="Target customer">
                      <ExpandableText text={startup.targetCustomer.trim()} />
                    </Field>
                  )}
                  {startup.businessModel.trim() && (
                    <Field label="Business model">
                      <ExpandableText text={startup.businessModel.trim()} />
                    </Field>
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {startup.needs.length > 0 && (
          <SectionCard title="Looking for" icon={<Sparkles className="size-4" />}>
            <div className="flex flex-wrap gap-1.5">
              {startup.needs.map((need) => (
                <Badge key={need} tone="primary" size="md">
                  {need}
                </Badge>
              ))}
            </div>
          </SectionCard>
        )}

        <OpenRolesCard startupId={startup.id} canManage={canManage} positions={positions} loading={positionsLoading} myUserId={myUserId} />

        <StartupMaterialsSection startupId={startup.id} canManage={canManage} />

        {keywords.length > 0 && (
          <SectionCard title="Topics" icon={<Tag className="size-4" />}>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((k) => (
                <Badge key={k} tone="neutral" size="md">
                  {k}
                </Badge>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
