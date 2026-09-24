import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Rocket } from 'lucide-react'
import { listIndustries } from '@/services/industries.service'
import { IndustryCard } from '@/components/domain/IndustryCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'

/**
 * Industry Analysis's landing page. Every industry here is a real sector spelling some startup or
 * catalog investor already has on BuildAdda — there's no separate curated list to fall out of sync
 * with real data. Search is server-side and lives in the URL so a filtered view can be reloaded.
 */
export default function IndustriesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [searchText, setSearchText] = useState(query)
  const searchTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  function handleSearchChange(value: string) {
    setSearchText(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      setSearchParams(next, { replace: true })
    }, 300)
  }

  const industries = useQuery({
    queryKey: ['industries', { query }],
    queryFn: () => listIndustries({ q: query || undefined }),
  })

  return (
    <div>
      <PageHeader
        title="Industries"
        description="Where BuildAdda's startups, investors and grants actually cluster — built from real data, not a fixed list."
      />

      <SearchFilterBar query={searchText} onQueryChange={handleSearchChange} placeholder="Search industries…" />

      {industries.isError ? (
        <ErrorState title="Couldn't load industries" onRetry={() => industries.refetch()} />
      ) : industries.isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : industries.data && industries.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {industries.data.map((industry) => (
            <IndustryCard key={industry.slug} industry={industry} />
          ))}
        </div>
      ) : query ? (
        <EmptyState
          icon={<TrendingUp className="size-5" />}
          title="No industries match"
          description="Try a different search term."
        />
      ) : (
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="No industries yet"
          description="Industries appear here once startups or catalog investors on BuildAdda tag a sector."
        />
      )}
    </div>
  )
}
