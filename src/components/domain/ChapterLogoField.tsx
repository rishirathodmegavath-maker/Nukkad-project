import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { Input } from '@/components/ui/Input'
import { UploadButton, type UploadPhase } from '@/components/ui/UploadButton'
import { uploadChapterLogoImage } from '@/services/chapters.service'
import { toast } from '@/store/toast.store'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'
/** Matches the server's limit for chapter logos (same as covers). */
const MAX_BYTES = 8 * 1024 * 1024

interface ChapterLogoFieldProps {
  /** The logo URL (uploaded or pasted). Empty means no logo — falls back to the chapter's initial. */
  value: string
  onChange: (url: string) => void
  /** The chapter's name, for the placeholder-letter fallback. */
  chapterName: string
  onUploadingChange?: (uploading: boolean) => void
  /** Defaults to the member-facing upload endpoint; the admin form passes its own admin-scoped one. */
  uploadFn?: (file: File) => Promise<string>
}

/** A chapter's small square logo — distinct from its wide cover banner. Same "upload or paste a
 *  link" shape as ChapterCoverField.tsx. */
export function ChapterLogoField({ value, onChange, chapterName, onUploadingChange, uploadFn = uploadChapterLogoImage }: ChapterLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const url = value.trim()

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
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
          Logo
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">Optional. A small square image: PNG, JPEG, WEBP or GIF, up to 8 MB.</p>
      </div>

      <div className="flex items-center gap-3">
        <EntityLogo src={url || undefined} name={chapterName || 'Chapter'} size="lg" />
        <div className="flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} aria-label="Choose a logo to upload" />
          <UploadButton
            variant="secondary"
            size="sm"
            phase={phase}
            idleLabel={url ? 'Replace logo' : 'Upload logo'}
            leftIcon={<ImagePlus className="size-3.5" aria-hidden="true" />}
            onClick={() => inputRef.current?.click()}
          />
          {url && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={phase === 'uploading'}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <Input label="Or paste an image link" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
    </div>
  )
}
