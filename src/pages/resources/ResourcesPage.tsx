import { useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus } from 'lucide-react'
import { listResources, createResource } from '@/services/resources.service'
import { listChapters } from '@/services/chapters.service'
import { ResourceCard } from '@/components/domain/ResourceCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import type { ResourceType } from '@/types'

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All types' },
  { key: 'Document', label: 'Documents' },
  { key: 'Link', label: 'Links' },
  { key: 'Video', label: 'Videos' },
  { key: 'Note', label: 'Notes' },
  { key: 'Template', label: 'Templates' },
]

const TYPES: ResourceType[] = ['Document', 'Link', 'Video', 'Note', 'Template']

function ShareResourceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ResourceType>('Document')
  const [source, setSource] = useState<'link' | 'file'>('link')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [chapterId, setChapterId] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { data: chapters } = useQuery({ queryKey: ['chapters', 'all'], queryFn: () => listChapters(), enabled: open })

  function reset() {
    setTitle('')
    setDescription('')
    setType('Document')
    setSource('link')
    setUrl('')
    setFile(null)
    setChapterId('')
    setTags([])
  }

  const mutation = useMutation({
    mutationFn: () =>
      createResource({
        title,
        description: description || undefined,
        type,
        url: source === 'link' ? url : undefined,
        file: source === 'file' ? (file ?? undefined) : undefined,
        chapterId: chapterId || undefined,
        tags,
      }),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      if (resource.chapterId) queryClient.invalidateQueries({ queryKey: ['chapter', resource.chapterId] })
      toast.success('Resource shared with the community')
      onClose()
      reset()
      navigate(`/resources/${resource.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not share this resource'),
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  const canSubmit = title.trim() && ((source === 'link' && url.trim()) || (source === 'file' && file))

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Share a resource"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Share
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            <option value="">No chapter — platform-wide</option>
            {(chapters ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Content</p>
          <PillTabs
            items={[
              { key: 'link', label: 'Link' },
              { key: 'file', label: 'Upload a file' },
            ]}
            value={source}
            onChange={(k) => setSource(k as 'link' | 'file')}
          />
        </div>

        {source === 'link' ? (
          <Input label="URL" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        ) : (
          <Input
            label="File"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf"
            onChange={handleFileChange}
          />
        )}

        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Tags</p>
          <TagInput value={tags} onChange={setTags} placeholder="Add a tag and press Enter…" />
        </div>
      </div>
    </Modal>
  )
}

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
