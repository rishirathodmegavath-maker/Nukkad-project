import { useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminResource,
  listAdminResourceChapters,
  removeAdminResourceThumbnail,
  replaceAdminResourceThumbnail,
  updateAdminResource,
} from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { PillTabs } from '@/components/ui/Tabs'
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_ORDER, isCategory, youtubeId } from '@/lib/resource-catalog'
import { toast } from '@/store/toast.store'
import type { Resource, ResourceCategory, ResourceType } from '@/types'

/** Mirrors the backend's allow-list (FileStorageService.RESOURCE_CONTENT_TYPES). The server is the real gate. */
const ACCEPTED_FILES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov'
const ACCEPTED_IMAGES = '.png,.jpg,.jpeg,.webp,.gif'

/**
 * Admin-only form to add a resource to the library (a link or an uploaded file) or edit one. Mount it
 * only while it is open so its fields start fresh each time. When editing an uploaded file its content
 * can't be swapped here — delete the resource and upload the new file — but everything else can,
 * including its card image.
 */
export function AdminResourceFormModal({ onClose, resource }: { onClose: () => void; resource?: Resource }) {
  const editing = !!resource
  const hostedFile = !!resource?.fileName
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(resource?.title ?? '')
  const [description, setDescription] = useState(resource?.description ?? '')
  const [type, setType] = useState<ResourceType>(resource?.type ?? 'Video')
  const [category, setCategory] = useState<ResourceCategory | ''>(resource?.category ?? '')
  const [provider, setProvider] = useState(resource?.provider ?? '')
  const [minutes, setMinutes] = useState(resource?.durationMinutes ? String(resource.durationMinutes) : '')
  const [featured, setFeatured] = useState(resource?.featured ?? false)
  const [source, setSource] = useState<'link' | 'file'>('link')
  const [url, setUrl] = useState(resource && !hostedFile ? resource.url : '')
  const [file, setFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)
  const [chapterId, setChapterId] = useState(resource?.chapterId ?? '')
  const [tags, setTags] = useState<string[]>(resource?.tags ?? [])

  const { data: chapters } = useQuery({ queryKey: ['admin', 'resource-chapters'], queryFn: listAdminResourceChapters })

  const durationMinutes = minutes.trim() === '' ? 0 : Number(minutes)
  const durationValid = Number.isInteger(durationMinutes) && durationMinutes >= 0 && durationMinutes <= 6000

  const mutation = useMutation({
    mutationFn: async () => {
      if (!resource) {
        return createAdminResource({
          title,
          description: description || undefined,
          type,
          category: category || undefined,
          provider: provider.trim() || undefined,
          durationMinutes: durationMinutes || undefined,
          featured,
          url: source === 'link' ? url : undefined,
          file: source === 'file' ? (file ?? undefined) : undefined,
          thumbnail: thumbnail ?? undefined,
          chapterId: chapterId || undefined,
          tags,
        })
      }
      const updated = await updateAdminResource(resource.id, {
        title,
        description,
        type,
        category,
        provider: provider.trim(),
        durationMinutes,
        featured,
        url: hostedFile ? undefined : url,
        chapterId,
        tags,
      })
      if (thumbnail) return replaceAdminResourceThumbnail(resource.id, thumbnail)
      if (removeThumbnail && resource.thumbnailUrl) return removeAdminResourceThumbnail(resource.id)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      if (resource) queryClient.invalidateQueries({ queryKey: ['resource', resource.id] })
      toast.success(editing ? 'Resource updated' : 'Resource added — members can see it now')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this resource'),
  })

  const hasContent = editing ? hostedFile || !!url.trim() : source === 'link' ? !!url.trim() : !!file
  const canSubmit = !!title.trim() && hasContent && durationValid
  const autoPoster = !editing && source === 'link' && !!youtubeId(url.trim())
  const showingCurrentThumbnail = editing && !!resource.thumbnailUrl && !removeThumbnail && !thumbnail

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit resource' : 'Add a resource'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            {editing ? 'Save changes' : 'Add resource'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {RESOURCE_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            label="Shelf"
            hint="Where it appears on the Resources page"
            value={category}
            onChange={(e) => setCategory(isCategory(e.target.value) ? e.target.value : '')}
          >
            <option value="">No shelf</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input label="Source" hint="Optional — e.g. Y Combinator" value={provider} maxLength={120} onChange={(e) => setProvider(e.target.value)} />
          <Input
            label="Duration (minutes)"
            hint="Optional"
            type="number"
            min={0}
            max={6000}
            value={minutes}
            error={durationValid ? undefined : 'Enter a whole number of minutes, up to 6000'}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            <option value="">No chapter — platform-wide</option>
            {(chapters ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {editing ? (
          hostedFile ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg-secondary">Uploaded file</p>
              <p className="break-all rounded-lg border border-border/80 bg-surface-sunken px-3 py-2 text-sm text-fg">{resource.fileName}</p>
              <p className="mt-1.5 text-xs text-fg-muted">To replace the file, delete this resource and add it again with the new file.</p>
            </div>
          ) : (
            <Input label="URL" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          )
        ) : (
          <>
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg-secondary">Content</p>
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
              <div>
                <Input
                  label="File"
                  type="file"
                  required
                  accept={ACCEPTED_FILES}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1.5 text-xs text-fg-muted">
                  PDF, Word, Excel, PowerPoint, CSV, text, ZIP, images or video — up to 50 MB. PDFs, images, video and text open in the
                  browser; the rest download.
                </p>
              </div>
            )}
          </>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Card image</p>
          {showingCurrentThumbnail && (
            <div className="mb-2 flex items-center gap-3">
              <img src={resource.thumbnailUrl} alt="" className="h-14 w-24 rounded-lg border border-border/80 object-cover" />
              <Button type="button" size="sm" variant="ghost" onClick={() => setRemoveThumbnail(true)}>
                Remove image
              </Button>
            </div>
          )}
          {editing && removeThumbnail && !thumbnail && (
            <p className="mb-2 text-xs text-fg-muted">The image will be removed when you save. Choose a file below to replace it instead.</p>
          )}
          <input
            type="file"
            accept={ACCEPTED_IMAGES}
            aria-label="Card image"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setThumbnail(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-fg-secondary file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border/80 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg hover:file:bg-surface-hover"
          />
          <p className="mt-1.5 text-xs text-fg-muted">
            {autoPoster
              ? 'Optional — this YouTube link already supplies its own picture.'
              : 'Optional PNG, JPEG, WEBP or GIF. Without one, YouTube links use their own picture and everything else gets a coloured placeholder.'}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer rounded-md border-border accent-[var(--color-brand-600)]"
          />
          <span>
            <span className="font-medium">Feature on the Resources page</span>
            <span className="block text-xs text-fg-muted">Shown in the “Featured resources” row at the top. Keep it to a few.</span>
          </span>
        </label>

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Tags</p>
          <TagInput value={tags} onChange={setTags} placeholder="Add a tag and press Enter…" maxLength={50} />
        </div>
      </div>
    </Modal>
  )
}
