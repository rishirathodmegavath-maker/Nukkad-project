import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Handshake, Users } from 'lucide-react'
import { listUsers } from '@/services/users.service'
import { getCofounderMatches, getPeopleRecommendations } from '@/services/matching.service'
import { PersonCard } from '@/components/domain/PersonCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs, Tabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { MyNetworkSection } from '@/pages/people/MyNetworkSection'
import type { LookingFor } from '@/types'

function PeopleYouMayKnow() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['users', 'recommendations'],
    queryFn: () => getPeopleRecommendations(6),
  })

  if (isLoading) return <CardSkeletonGrid count={3} />
  if (!recommendations || recommendations.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-fg-secondary mb-3">People you may know</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <PersonCard key={rec.user.id} user={rec.user} reasons={rec.reasons} />
        ))}
      </div>
    </div>
  )
}

/** Rewords backend compatibility reasons into product-friendly language — no scoring/ranking logic here, purely display text. */
const COFOUNDER_REASON_OVERRIDES: Record<string, string> = {
  "Compatible looking-for / open-to interests": "Has skills you're looking for",
}

function humanizeCofounderReason(reason: string): string {
  const bringsSkills = reason.match(/^Brings (.+) skills you don't have$/)
  if (bringsSkills) return `Brings complementary ${bringsSkills[1]} skills`
  return COFOUNDER_REASON_OVERRIDES[reason] ?? reason
}

function CofoundersYouMightClickWith() {
  const { data: matches, isLoading, isError } = useQuery({
    queryKey: ['users', 'matches'],
    queryFn: () => getCofounderMatches(6),
  })

  if (isLoading) return <CardSkeletonGrid count={3} />
  if (isError || !matches || matches.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Handshake className="size-4 text-accent-600" />
        <h2 className="text-sm font-semibold text-fg-secondary">Co-founders you might click with</h2>
      </div>
      <p className="text-xs text-fg-muted mb-3">
        People whose skills and goals complement yours — not just people similar to you.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match) => (
          <PersonCard
            key={match.user.id}
            user={match.user}
            reasons={match.reasons.map(humanizeCofounderReason)}
            compatibilityScore={match.score}
          />
        ))}
      </div>
    </div>
  )
}

const LOOKING_FOR_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'Co-founder', label: 'Co-founder' },
  { key: 'Team to join', label: 'Team to join' },
  { key: 'Job', label: 'Job' },
  { key: 'Founding Role', label: 'Founding Role' },
  { key: 'Investment', label: 'Investment' },
  { key: 'Mentorship', label: 'Mentorship' },
]

type NetworksView = 'discover' | 'network'

export default function PeopleListPage() {
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<NetworksView>('discover')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [lookingFor, setLookingFor] = useState('all')
  const isFiltering = lookingFor !== 'all' || query.trim().length > 0

  const filters = useMemo(
    () => ({
      query: query || undefined,
      lookingFor: lookingFor === 'all' ? undefined : (lookingFor as LookingFor),
    }),
    [query, lookingFor],
  )

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsers(filters),
    enabled: view === 'discover',
  })

  return (
    <div>
      <PageHeader title="Networks" description="Discover builders, designers, operators and investors — and grow your network on Nukkad." />

      <Tabs
        items={[
          { key: 'discover', label: 'Discover' },
          { key: 'network', label: 'My Network' },
        ]}
        value={view}
        onChange={(key) => setView(key as NetworksView)}
        className="mb-6"
      />

      {view === 'network' ? (
        <MyNetworkSection />
      ) : (
        <>
          <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search by name, skill or headline…">
            <PillTabs
              items={LOOKING_FOR_FILTERS.map((f) => ({ key: f.key, label: f.label }))}
              value={lookingFor}
              onChange={setLookingFor}
            />
          </SearchFilterBar>

          {/* Recommendations ignore the search/lookingFor filters by design — hide them once the
              user has expressed a specific intent, so they don't look like unfiltered results. */}
          {!isFiltering && (
            <>
              <PeopleYouMayKnow />
              <CofoundersYouMightClickWith />
            </>
          )}

          <h2 className="text-sm font-semibold text-fg-secondary mb-3">
            {isFiltering ? `Matching people${users ? ` (${users.length})` : ''}` : 'All people'}
          </h2>

          {isLoading ? (
            <CardSkeletonGrid count={9} />
          ) : users && users.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.map((user) => (
                <PersonCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No one matches yet"
              description="Try a different search term or clear your filters."
            />
          )}
        </>
      )}
    </div>
  )
}
