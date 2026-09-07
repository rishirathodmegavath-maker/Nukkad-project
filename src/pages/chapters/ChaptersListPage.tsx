import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Plus } from 'lucide-react'
import { getChapter, listChapters } from '@/services/chapters.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ChapterCard } from '@/components/domain/ChapterCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { Chapter } from '@/types'

export default function ChaptersListPage() {
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const { data: currentUser } = useCurrentUser()

  const filters = useMemo(() => ({ query }), [query])

  const { data: allChapters, isLoading, isError, refetch } = useQuery({
    queryKey: ['chapters', filters],
    queryFn: () => listChapters(filters),
    enabled: !mineOnly,
  })

  // "My chapters" means led OR joined — a user can preside over several chapters but can only
  // ever be a member of one (currentUser.chapterId), so the presidency list and that single
  // joined chapter (which may not match the current search query) both need fetching directly.
  const { data: ledChapters, isLoading: ledLoading, isError: ledError } = useQuery({
    queryKey: ['chapters', 'led-by', currentUser?.id],
    queryFn: () => listChapters({ presidentUserId: currentUser!.id }),
    enabled: mineOnly && !!currentUser,
  })
  const { data: joinedChapter } = useQuery({
    queryKey: ['chapter', currentUser?.chapterId],
    queryFn: () => getChapter(currentUser!.chapterId!),
    enabled: mineOnly && !!currentUser?.chapterId,
  })

  const mineChapters = useMemo<Chapter[] | undefined>(() => {
    if (!mineOnly) return undefined
    if (!ledChapters) return undefined
    const merged = new Map<string, Chapter>(ledChapters.map((c) => [c.id, c]))
    if (joinedChapter) merged.set(joinedChapter.id, joinedChapter)
    const q = query.trim().toLowerCase()
    const list = [...merged.values()]
    return q ? list.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)) : list
  }, [mineOnly, ledChapters, joinedChapter, query])

  const chapters = mineOnly ? mineChapters : allChapters
  const chaptersLoading = mineOnly ? ledLoading && !ledChapters : isLoading
  const chaptersError = mineOnly ? ledError : isError

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

      {chaptersLoading ? (
        <CardSkeletonGrid count={4} />
      ) : chaptersError ? (
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
          title="You haven't joined or created a chapter yet"
          description="Join an existing chapter or start one for your campus, city, or tech hub."
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
