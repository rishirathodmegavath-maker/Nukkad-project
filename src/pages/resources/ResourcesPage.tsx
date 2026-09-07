import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Plus } from 'lucide-react'
import { listResources } from '@/services/resources.service'
import { ResourceCard } from '@/components/domain/ResourceCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ShareResourceModal } from '@/components/domain/ShareResourceModal'
import type { ResourceType } from '@/types'

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All types' },
  { key: 'Document', label: 'Documents' },
  { key: 'Link', label: 'Links' },
  { key: 'Video', label: 'Videos' },
  { key: 'Note', label: 'Notes' },
  { key: 'Template', label: 'Templates' },
]

export default function ResourcesPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)

  const filters = useMemo(
    () => ({ query: query || undefined, type: type === 'all' ? undefined : (type as ResourceType) }),
    [query, type],
  )

  const { data: resources, isLoading, isError, refetch } = useQuery({ queryKey: ['resources', filters], queryFn: () => listResources(filters) })

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Templates, guides and links shared by the community."
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => setUploadOpen(true)}>
            Share a resource
          </Button>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Search resources…">
        <PillTabs items={TYPE_FILTERS} value={type} onChange={setType} />
      </SearchFilterBar>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : isError ? (
        <ErrorState title="Couldn't load resources" onRetry={refetch} />
      ) : resources && resources.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen className="size-5" />}
          title="No resources match yet"
          description="Pitch decks, legal templates, guidebooks, and links shared by builders will show up here."
          action={
            <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setUploadOpen(true)}>
              Share a resource
            </Button>
          }
        />
      )}

      <ShareResourceModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
