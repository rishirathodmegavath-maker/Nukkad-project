import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import type { LogoDraft } from '@/components/startup/create/create-startup-model'

interface LogoPickerProps {
  startupName: string
  logo: LogoDraft | null
  onChange: (logo: LogoDraft | null) => void
}

/**
 * Choose and crop the startup's logo. The picture is only kept here until the startup exists; then it goes through the
 * same upload every startup logo uses (there is no address to store before that).
 */
export function LogoPicker({ startupName, logo, onChange }: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPending(file)
    e.target.value = ''
  }

  function replace(next: LogoDraft | null) {
    if (logo) URL.revokeObjectURL(logo.previewUrl)
    onChange(next)
  }

  return (
    <div className="flex items-center gap-4">
      <EntityLogo src={logo?.previewUrl} name={startupName.trim() || 'Your startup'} size="xl" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-secondary">
          Logo <span className="font-normal text-fg-muted">(optional)</span>
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">A square picture works best. PNG, JPG, WebP or GIF.</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="secondary" leftIcon={<Camera className="size-3.5" />} onClick={() => inputRef.current?.click()}>
            {logo ? 'Change logo' : 'Upload logo'}
          </Button>
          {logo && (
            <Button type="button" size="sm" variant="ghost" leftIcon={<Trash2 className="size-3.5" />} onClick={() => replace(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        id="create-startup-logo"
        name="create-startup-logo"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      <ImageCropModal
        file={pending}
        aspect={1}
        shape="rect"
        title="Crop logo"
        outputWidth={640}
        onCancel={() => setPending(null)}
        onConfirm={(cropped) => {
          setPending(null)
          replace({ file: cropped, previewUrl: URL.createObjectURL(cropped) })
        }}
      />
    </div>
  )
}
