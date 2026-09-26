import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ImageOff, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CoverImage } from '@/components/ui/CoverImage'
import { Input } from '@/components/ui/Input'
import { UploadButton, type UploadPhase } from '@/components/ui/UploadButton'
import { uploadChapterCoverImage } from '@/services/chapters.service'
import { toast } from '@/store/toast.store'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'
/** Matches the server's limit for chapter covers. */
const MAX_BYTES = 8 * 1024 * 1024

interface ChapterCoverFieldProps {
  /** The cover image URL (uploaded or pasted). Empty means no cover. */
  value: string
  onChange: (url: string) => void
  /** Lets the form hold its Save/Create button until an upload has finished, so a cover is never silently dropped. */
  onUploadingChange?: (uploading: boolean) => void
  /** Defaults to the member-facing upload endpoint; the admin form passes its own admin-scoped one,
   *  since an admin-portal token can't call the member endpoint. */
  uploadFn?: (file: File) => Promise<string>
}

/**
 * The cover picture of a chapter: upload a file, or paste a link to one. Either way the form ends up with a
 * URL, so a cover can be chosen while the chapter is still being written.
 */
export function ChapterCoverField({ value, onChange, onUploadingChange, uploadFn = uploadChapterCoverImage }: ChapterCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const url = value.trim()

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still fires
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image: PNG, JPEG, WEBP or GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('That image is larger than 8 MB. Please choose a smaller one.')
      return
    }
    setPhase('uploading')
    onUploadingChange?.(true)
    try {
      onChange(await uploadFn(file))
      setPhase('done')
      window.setTimeout(() => setPhase('idle'), 1200)
    } catch (err) {
      setPhase('idle')
      toast.error(err instanceof Error ? err.message : 'Could not upload the image')
    } finally {
      onUploadingChange?.(false)
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-3">
      <div>
        <p id={labelId} className="text-sm font-medium text-fg-secondary">
          Cover image
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">Optional. Wide pictures look best: PNG, JPEG, WEBP or GIF, up to 8 MB.</p>
      </div>

      {url && (
        <div className="h-36 w-full overflow-hidden rounded-lg border border-border/80 bg-surface-sunken sm:h-44">
          <CoverImage
            src={url}
            alt="Cover image preview"
            className="size-full object-cover"
            fallback={
              <div className="flex size-full items-center justify-center gap-2 text-sm text-fg-muted">
                <ImageOff className="size-4" aria-hidden="true" />
                This link doesn&apos;t show an image
              </div>
            }
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} aria-label="Choose a cover image to upload" />
        <UploadButton
          variant="secondary"
          size="sm"
          phase={phase}
          idleLabel={url ? 'Replace image' : 'Upload image'}
          leftIcon={<ImagePlus className="size-3.5" aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
        />
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={phase === 'uploading'}>
            Remove
          </Button>
        )}
      </div>

      <Input
        label="Or paste an image link"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
    </div>
  )
}
