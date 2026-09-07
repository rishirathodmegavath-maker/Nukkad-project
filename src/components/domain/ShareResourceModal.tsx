import { useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createResource } from '@/services/resources.service'
import { listChapters } from '@/services/chapters.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { PillTabs } from '@/components/ui/Tabs'
import { toast } from '@/store/toast.store'
import type { ResourceType } from '@/types'

const TYPES: ResourceType[] = ['Document', 'Link', 'Video', 'Note', 'Template']

export function ShareResourceModal({
  open,
  onClose,
  lockedChapterId,
  lockedChapterName,
}: {
  open: boolean
  onClose: () => void
  /** When set, the resource is created directly under this chapter — the chapter picker is
   *  replaced with a fixed label instead of letting the uploader retarget it elsewhere. */
  lockedChapterId?: string
  lockedChapterName?: string
}) {
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

  const { data: chapters } = useQuery({
    queryKey: ['chapters', 'all'],
    queryFn: () => listChapters(),
    enabled: open && !lockedChapterId,
  })

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
        chapterId: lockedChapterId || chapterId || undefined,
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
          {lockedChapterId ? (
            <div>
              <p className="text-sm font-medium text-fg mb-1.5">Chapter</p>
              <p className="text-sm text-fg-muted px-3 py-2 rounded-lg border border-border/80 bg-surface-sunken">
                {lockedChapterName ?? 'This chapter'}
              </p>
            </div>
          ) : (
            <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
              <option value="">No chapter — platform-wide</option>
              {(chapters ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
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
