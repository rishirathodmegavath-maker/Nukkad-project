import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash2 } from 'lucide-react'
import { removeStartupLogo, uploadStartupLogo } from '@/services/startups.service'
import { Button } from '@/components/ui/Button'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import { toast } from '@/store/toast.store'
import type { Startup } from '@/types'

/**
 * The startup's logo. Unlike the text fields it saves the moment it is chosen (a picture is uploaded, not typed), so it
 * sits outside the form's Save button. It uses the same upload and remove calls as the logo on the profile.
 */
export function LogoField({ startup }: { startup: Startup }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }
  const upload = useMutation({
    mutationFn: (file: File) => uploadStartupLogo(startup.id, file),
    onSuccess: () => {
      refresh()
      toast.success('Logo updated')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'The logo couldn’t be uploaded'),
  })
  const remove = useMutation({
    mutationFn: () => removeStartupLogo(startup.id),
    onSuccess: () => {
      refresh()
      toast.success('Logo removed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'The logo couldn’t be removed'),
  })

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPending(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      <EntityLogo src={startup.logoUrl} name={startup.name} size="xl" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-secondary">Logo</p>
        <p className="mt-0.5 text-xs text-fg-muted">A square picture works best. PNG, JPG, WebP or GIF. Saved as soon as you choose it.</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="secondary" leftIcon={<Camera className="size-3.5" />} isLoading={upload.isPending} onClick={() => inputRef.current?.click()}>
            {startup.logoUrl ? 'Change logo' : 'Upload logo'}
          </Button>
          {startup.logoUrl && (
            <Button type="button" size="sm" variant="ghost" leftIcon={<Trash2 className="size-3.5" />} isLoading={remove.isPending} onClick={() => remove.mutate()}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        id="manage-startup-logo"
        name="manage-startup-logo"
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
          upload.mutate(cropped)
        }}
      />
    </div>
  )
}
