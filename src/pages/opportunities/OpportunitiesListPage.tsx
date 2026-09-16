import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus, Inbox, ListChecks } from 'lucide-react'
import { listOpportunities, listRecommendedOpportunities } from '@/services/opportunities.service'
import { listMyFoundedStartups } from '@/services/startups.service'
import { OpportunityCard } from '@/components/domain/OpportunityCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { OpportunityType } from '@/types'

function RecommendedOpportunities() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['opportunities', 'recommended'],
    queryFn: () => listRecommendedOpportunities(6),
  })

  if (isLoading) return <CardSkeletonGrid count={3} />
  if (!matches || matches.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-fg-secondary mb-3">Recommended for you</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match) => (
          <OpportunityCard key={match.opportunity.id} opportunity={match.opportunity} reasons={match.reasons} />
        ))}
      </div>
    </div>
  )
}

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All types' },
  { key: 'Full-time', label: 'Full-time' },
  { key: 'Internship', label: 'Internship' },
  { key: 'Founding Role', label: 'Founding Role' },
  { key: 'Co-founder', label: 'Co-founder' },
  { key: 'Startup Project', label: 'Startup Project' },
  { key: 'AI/ML Role', label: 'AI/ML Role' },
  { key: 'Campus', label: 'Campus' },
]

export default function OpportunitiesListPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const isFiltering = type !== 'all' || query.trim().length > 0

  const filters = useMemo(
    () => ({ query: query || undefined, type: type === 'all' ? undefined : (type as OpportunityType) }),
    [query, type],
  )

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => listOpportunities(filters),
  })

  // Only needed to decide the empty-state CTA below, so it's fine to fetch quietly in the
  // background rather than blocking the page — a founder deserves a "post one" nudge only when
  // there's truly nothing to show them yet.
  const { data: foundedStartups } = useQuery({
    queryKey: ['startups', 'me', 'founding'],
    queryFn: listMyFoundedStartups,
  })
  const canPost = !!foundedStartups && foundedStartups.length > 0

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Jobs, internships, founding roles and co-founder openings from across Nukkad."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/opportunities/mine">
              <Button variant="ghost" size="sm" leftIcon={<Inbox className="size-4" />}>
                My Applications
              </Button>
            </Link>
            <Link to="/opportunities/posted">
              <Button variant="ghost" size="sm" leftIcon={<ListChecks className="size-4" />}>
                Posted by Me
              </Button>
            </Link>
            <Link to="/opportunities/new">
              <Button size="sm" leftIcon={<Plus className="size-4" />}>
                Post Opportunity
              </Button>
            </Link>
          </div>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search opportunities…">
        <PillTabs items={TYPE_FILTERS} value={type} onChange={setType} />
      </SearchFilterBar>

      {/* Recommendations ignore the type/search filters by design — hide them once the
          user has expressed a specific intent, so they don't look like unfiltered results. */}
      {!isFiltering && <RecommendedOpportunities />}

      <h2 className="text-sm font-semibold text-fg-secondary mb-3">
        {isFiltering ? `Matching opportunities${opportunities ? ` (${opportunities.length})` : ''}` : 'All opportunities'}
      </h2>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : opportunities && opportunities.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : isFiltering ? (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="No opportunities match yet"
          description="Try a different search or filter."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery('')
                setType('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : canPost ? (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="No opportunities posted yet"
          description="Be the first to post a job, internship, or founding role for the Nukkad community."
          action={
            <Link to="/opportunities/new">
              <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                Post an opportunity
              </Button>
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="No opportunities posted yet"
          description="Check back soon, or register a startup to post one yourself."
        />
      )}
    </div>
  )
}
