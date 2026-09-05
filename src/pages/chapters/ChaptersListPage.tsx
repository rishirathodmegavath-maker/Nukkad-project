import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Plus } from 'lucide-react'
import { listChapters } from '@/services/chapters.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ChapterCard } from '@/components/domain/ChapterCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export default function ChaptersListPage() {
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const { data: currentUser } = useCurrentUser()

  const filters = useMemo(
    () => ({ query, presidentUserId: mineOnly ? currentUser?.id : undefined }),
    [query, mineOnly, currentUser?.id],
  )

  const { data: chapters, isLoading, isError, refetch } = useQuery({
    queryKey: ['chapters', filters],
    queryFn: () => listChapters(filters),
    enabled: !mineOnly || !!currentUser,
  })

  return (
    <div>
      <PageHeader
        title="Chapters"
        description="Find your local Nukkad community — meetups, chapter resources and leadership."
        action={
          <Link to="/chapters/new">
            <Button leftIcon={<Plus className="size-4" />}>Create a chapter</Button>
          </Link>
        }
      />

      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search chapters by name or city…">
        <PillTabs
          items={[
            { key: 'all', label: 'All chapters' },
            { key: 'mine', label: 'My chapters' },
          ]}
          value={mineOnly ? 'mine' : 'all'}
          onChange={(k) => setMineOnly(k === 'mine')}
        />
      </SearchFilterBar>

      {isLoading ? (
        <CardSkeletonGrid count={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load chapters" onRetry={refetch} />
      ) : chapters && chapters.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : mineOnly ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="You haven't created a chapter yet"
          description="Start a chapter for your campus, city, or tech hub to see it here."
          action={
            <Link to="/chapters/new">
              <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                Create a chapter
              </Button>
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="No chapters match yet"
          description="Start a chapter for your campus, city, or tech hub."
          action={
            <Link to="/chapters/new">
              <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                Create a chapter
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
