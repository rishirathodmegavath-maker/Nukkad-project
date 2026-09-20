import { useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { addStartupMaterial, updateStartupMaterial } from '@/services/startups.service'
import { toast } from '@/store/toast.store'
import type { StartupMaterial, StartupMaterialType } from '@/types'

const EXTERNAL_TYPES: StartupMaterialType[] = ['Website', 'LinkedIn', 'X']
const UPLOAD_TYPES: StartupMaterialType[] = ['Pitch Deck', 'Product Demo', 'Screenshots', 'Other Document']
const ALL_TYPES: StartupMaterialType[] = [...EXTERNAL_TYPES, ...UPLOAD_TYPES]

const ACCEPT_BY_TYPE: Record<string, string> = {
  Screenshots: 'image/png,image/jpeg,image/webp,image/gif',
  'Pitch Deck': 'application/pdf',
  'Other Document': 'application/pdf',
  'Product Demo': 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime',
}

export function StartupMaterialFormModal({
  open,
  onClose,
  startupId,
  editing,
  defaultType,
}: {
  open: boolean
  onClose: () => void
  startupId: string
  editing?: StartupMaterial
  defaultType?: StartupMaterialType
}) {
  const queryClient = useQueryClient()
  const [materialType, setMaterialType] = useState<StartupMaterialType>(editing?.materialType ?? defaultType ?? 'Website')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [url, setUrl] = useState(editing?.url && EXTERNAL_TYPES.includes(materialType) ? editing.url : '')
  const [file, setFile] = useState<File | null>(null)

  const isExternal = EXTERNAL_TYPES.includes(materialType)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? updateStartupMaterial(startupId, editing.id, { title: title || undefined, url: isExternal ? url : undefined, file: file ?? undefined })
        : addStartupMaterial(startupId, materialType, { title: title || undefined, url: isExternal ? url : undefined, file: file ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', startupId, 'materials'] })
      toast.success(editing ? 'Material updated' : 'Material added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this material'),
  })

  const canSubmit = isExternal ? url.trim().length > 0 : !!file || !!editing

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit material' : 'Add startup material'} size="md">
      <div className="flex flex-col gap-4">
        {!editing && (
          <Select label="Type" value={materialType} onChange={(e) => setMaterialType(e.target.value as StartupMaterialType)}>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        )}

        <Input label="Label" hint="Optional" placeholder="e.g. Seed deck (Sept 2026)" value={title} onChange={(e) => setTitle(e.target.value)} />

        {isExternal ? (
          <Input label="URL" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">
              {editing ? 'Replace file' : 'File'}
            </p>
            <input
              type="file"
              id="startup-material-file"
              name="startup-material-file"
              accept={ACCEPT_BY_TYPE[materialType]}
              onChange={handleFileChange}
              className="block w-full text-sm text-fg-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 dark:file:bg-brand-900/40 file:text-brand-700 dark:file:text-brand-300 file:px-3.5 file:py-2 file:text-sm file:font-medium hover:file:bg-brand-100 dark:hover:file:bg-brand-900/60 cursor-pointer"
            />
            {editing && !file && <p className="text-xs text-fg-muted mt-1.5">Leave blank to keep the current file.</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            {editing ? 'Save changes' : 'Add material'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
