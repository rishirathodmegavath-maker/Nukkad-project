import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Lightbulb, Plus } from 'lucide-react'
import { listIdeas, listRecommendedIdeas } from '@/services/ideas.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { IdeaCard } from '@/components/domain/IdeaCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { buttonClasses } from '@/components/ui/button-styles'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { IdeaStage } from '@/types'

const STAGE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All stages' },
  { key: 'Concept', label: 'Concept' },
  { key: 'Validating', label: 'Validating' },
  { key: 'Building', label: 'Building' },
  { key: 'Launched', label: 'Launched' },
]

function RecommendedIdeas() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['ideas', 'recommended'],
    queryFn: () => listRecommendedIdeas(6),
  })

  if (isLoading) return <CardSkeletonGrid count={3} />
  if (!matches || matches.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-fg-secondary mb-3">Recommended for you</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match) => (
          <IdeaCard key={match.idea.id} idea={match.idea} reasons={match.reasons} />
        ))}
      </div>
    </div>
  )
}

export default function IdeasListPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [stage, setStage] = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const { data: currentUser } = useCurrentUser()
  const isFiltering = mineOnly || stage !== 'all' || query.trim().length > 0

  const filters = useMemo(
    () => ({
      query: query || undefined,
      stage: stage === 'all' ? undefined : (stage as IdeaStage),
      creatorId: mineOnly ? currentUser?.id : undefined,
    }),
    [query, stage, mineOnly, currentUser?.id],
  )

  const { data: ideas, isLoading } = useQuery({
    queryKey: ['ideas', filters],
    queryFn: () => listIdeas(filters),
    enabled: !mineOnly || !!currentUser,
  })

  return (
    <div>
      <PageHeader
        title="Ideas"
        description="Browse what builders are exploring — or post your own and find a team."
        action={
          <Link to="/ideas/new" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden="true" />
            Post an idea
          </Link>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Filter ideas by title or problem…">
        <PillTabs label="Stage" items={STAGE_FILTERS} value={stage} onChange={setStage} />
        <PillTabs
          tone="soft"
          label="Whose ideas"
          items={[
            { key: 'all', label: 'All ideas' },
            { key: 'mine', label: 'My ideas' },
          ]}
          value={mineOnly ? 'mine' : 'all'}
          onChange={(k) => setMineOnly(k === 'mine')}
        />
      </SearchFilterBar>

      {/* Recommendations ignore the search/stage/mine filters by design — hide them once the
          user has expressed a specific intent, so they don't look like unfiltered results. */}
      {!isFiltering && <RecommendedIdeas />}

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : ideas && ideas.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : mineOnly ? (
        <EmptyState
          icon={<Lightbulb className="size-5" />}
          title="You haven't posted any ideas yet"
          description="Post an idea to find a team and see it here."
          action={
            <Link to="/ideas/new" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden="true" />
              Post an idea
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<Lightbulb className="size-5" />}
          title="No ideas match yet"
          description="Try a different search, or be the first to post one."
          action={
            <Link to="/ideas/new" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden="true" />
              Post an idea
            </Link>
          }
        />
      )}
    </div>
  )
}
