import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { listOpportunities } from '@/services/opportunities.service'
import { OpportunityCard } from '@/components/domain/OpportunityCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { OpportunityType } from '@/types'

/** The kinds of opportunity that are jobs (as opposed to founding roles, co-founder openings, projects or campus programmes). */
const JOB_TYPES: OpportunityType[] = ['Full-time', 'Internship', 'AI/ML Role']

const FILTERS = [{ key: 'all', label: 'All jobs' }, ...JOB_TYPES.map((t) => ({ key: t, label: t }))]

/**
 * Jobs: the opportunities that are jobs, newest first. It is a view of the same listings as Opportunities (a job posted
 * there shows up here), so there is nothing extra to post or keep in sync.
 */
export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const types = type === 'all' ? JOB_TYPES : [type as OpportunityType]

  // The server filters by one type at a time, so "All jobs" asks for each job type and merges the answers.
  const results = useQueries({
    queries: types.map((t) => ({
      queryKey: ['opportunities', 'jobs', t, query],
      queryFn: () => listOpportunities({ query: query || undefined, type: t }),
    })),
  })
  const isLoading = results.some((r) => r.isLoading)
  const jobs = results.flatMap((r) => r.data ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const isFiltering = type !== 'all' || query.trim().length > 0

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Full-time roles, internships and AI/ML openings from startups and partners on BuildAdda."
        action={
          <Link to="/opportunities/new" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden="true" />
            Post a job
          </Link>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search jobs…">
        <PillTabs items={FILTERS} value={type} onChange={setType} />
      </SearchFilterBar>

      <h2 className="text-sm font-semibold text-fg-secondary mb-3">
        {isLoading ? 'Jobs' : `${isFiltering ? 'Matching jobs' : 'All jobs'} (${jobs.length})`}
      </h2>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : jobs.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <OpportunityCard key={job.id} opportunity={job} />
          ))}
        </div>
      ) : isFiltering ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No jobs match yet"
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
      ) : (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No jobs posted yet"
          description="Full-time roles and internships will show up here as startups post them. Looking for a founding role or a co-founder? Browse all opportunities."
          action={
            <Link to="/opportunities" className={buttonClasses({ variant: 'secondary' })}>
              See all opportunities
            </Link>
          }
        />
      )}
    </div>
  )
}
