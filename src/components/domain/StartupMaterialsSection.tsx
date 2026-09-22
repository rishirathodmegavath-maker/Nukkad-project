import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, FileText, Video, Image as ImageIcon, Link2, Plus, Pencil, Trash2, FolderOpen, ExternalLink } from 'lucide-react'
import { getStartupMaterials, deleteStartupMaterial } from '@/services/startups.service'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { StartupMaterialFormModal } from '@/components/domain/StartupMaterialFormModal'
import { toast } from '@/store/toast.store'
import type { StartupMaterial, StartupMaterialType } from '@/types'

const ICONS: Record<StartupMaterialType, typeof Globe> = {
  Website: Globe,
  'Pitch Deck': FileText,
  'Product Demo': Video,
  Screenshots: ImageIcon,
  LinkedIn: Link2,
  X: Link2,
  'Other Document': FileText,
}

function MaterialRow({ material, canManage, onEdit, onDelete, deleting }: {
  material: StartupMaterial
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const Icon = ICONS[material.materialType]
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-3 transition-colors hover:border-border-strong hover:bg-surface-hover">
      <a href={material.url} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-fg-brand">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg group-hover:underline">{material.title || material.materialType}</span>
          <span className="block truncate text-xs text-fg-muted">{material.title ? material.materialType : material.originalFileName || 'Open link'}</span>
        </span>
        <ExternalLink className="size-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
      </a>
      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            title="Edit material"
            aria-label={`Edit ${material.title || material.materialType}`}
            className="cursor-pointer rounded-md p-1.5 text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            title="Delete material"
            aria-label={`Delete ${material.title || material.materialType}`}
            className="cursor-pointer rounded-md p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

/** The links and files a startup shares (pitch deck, demo, website, socials). A visitor only sees this card when there is something in it. */
export function StartupMaterialsSection({ startupId, canManage }: { startupId: string; canManage: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StartupMaterial | undefined>(undefined)
  const [toDelete, setToDelete] = useState<StartupMaterial | null>(null)

  const materialsQuery = useQuery({
    queryKey: ['startup', startupId, 'materials'],
    queryFn: () => getStartupMaterials(startupId),
  })

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => deleteStartupMaterial(startupId, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', startupId, 'materials'] })
      setToDelete(null)
      toast.info('Material removed')
    },
    onError: (err) => {
      setToDelete(null)
      toast.error(err instanceof Error ? err.message : 'Could not remove this material')
    },
  })

  const materials = materialsQuery.data ?? []

  // Nothing to show a visitor, and nothing they can add: leave the card out instead of showing an empty box.
  if (!materialsQuery.isLoading && materials.length === 0 && !canManage) return null

  return (
    <SectionCard
      title="Materials"
      icon={<FolderOpen className="size-4" />}
      action={
        canManage ? (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            Add
          </Button>
        ) : undefined
      }
    >
      {materialsQuery.isLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : materials.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {materials.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              canManage={canManage}
              onEdit={() => {
                setEditing(m)
                setFormOpen(true)
              }}
              onDelete={() => setToDelete(m)}
              deleting={deleteMutation.isPending && deleteMutation.variables === m.id}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-fg-muted">No materials yet. Add a pitch deck, demo or website so people can learn more.</p>
      )}

      {formOpen && <StartupMaterialFormModal open={formOpen} onClose={() => setFormOpen(false)} startupId={startupId} editing={editing} />}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove this material?"
        description={`“${toDelete?.title || toDelete?.materialType || 'This material'}” will no longer be shown on your startup.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">You can add it again later.</p>
      </Modal>
    </SectionCard>
  )
}
