import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash2 } from 'lucide-react'
import { uploadStartupLogo, removeStartupLogo } from '@/services/startups.service'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import { UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { toast } from '@/store/toast.store'
import type { Startup } from '@/types'

/**
 * The startup's logo on its profile. Anyone who can manage the startup gets a small menu on it to add, change or remove
 * the picture (the server decides who really may); everyone else just sees the logo.
 */
export function StartupLogo({ startup, canManage }: { startup: Startup; canManage: boolean }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }

  const upload = useMutation({
    mutationFn: (file: File) => uploadStartupLogo(startup.id, file),
    onSuccess: () => {
      refresh()
      setPhase('done')
      setTimeout(() => setPhase('idle'), 1200)
      toast.success('Logo updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('idle')
    },
  })

  const remove = useMutation({
    mutationFn: () => removeStartupLogo(startup.id),
    onSuccess: () => {
      refresh()
      toast.success('Logo removed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove logo'),
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  const logo = <EntityLogo src={startup.logoUrl} name={startup.name} size="xl" className="ring-4 ring-surface" />
  if (!canManage) return logo

  return (
    <>
      <div className="relative shrink-0">
        <DropdownMenu
          align="left"
          trigger={
            <button type="button" className="group relative block cursor-pointer rounded-2xl" aria-label="Logo options">
              {logo}
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="size-5" />
              </span>
              {/* Always visible, so a phone (no hover) can still find it. */}
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-fg-secondary shadow-xs">
                <Camera className="size-3.5" aria-hidden="true" />
              </span>
              <UploadSpinnerOverlay phase={phase} />
            </button>
          }
        >
          <DropdownItem icon={<Camera className="size-4" />} onClick={() => inputRef.current?.click()}>
            {startup.logoUrl ? 'Change logo' : 'Add logo'}
          </DropdownItem>
          {startup.logoUrl && (
            <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => remove.mutate()}>
              Remove logo
            </DropdownItem>
          )}
        </DropdownMenu>
      </div>
      <input
        ref={inputRef}
        type="file"
        id="startup-logo-upload"
        name="startup-logo-upload"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <ImageCropModal
        file={pendingFile}
        aspect={1}
        shape="rect"
        title="Crop logo"
        outputWidth={640}
        onCancel={() => setPendingFile(null)}
        onConfirm={(cropped) => {
          setPendingFile(null)
          setPhase('uploading')
          upload.mutate(cropped)
        }}
      />
    </>
  )
}
