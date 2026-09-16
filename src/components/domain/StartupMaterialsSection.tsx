import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, FileText, Video, Image as ImageIcon, Link2, Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { getStartupMaterials, deleteStartupMaterial } from '@/services/startups.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
    <div className="flex items-center justify-between gap-3 border border-border-subtle rounded-lg p-3">
      <a
        href={material.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 min-w-0 group"
      >
        <span className="flex items-center justify-center size-8 rounded-lg bg-surface-sunken text-fg-secondary shrink-0">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-fg group-hover:underline truncate">
            {material.title || material.materialType}
          </span>
          <span className="block text-xs text-fg-muted truncate">
            {material.title ? material.materialType : material.originalFileName || 'Open link'}
          </span>
        </span>
      </a>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            title="Edit material"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            title="Delete material"
            className="rounded-md p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export function StartupMaterialsSection({ startupId, canManage }: { startupId: string; canManage: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StartupMaterial | undefined>(undefined)

  const materialsQuery = useQuery({
    queryKey: ['startup', startupId, 'materials'],
    queryFn: () => getStartupMaterials(startupId),
  })

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => deleteStartupMaterial(startupId, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', startupId, 'materials'] })
      toast.info('Material removed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove this material'),
  })

  const materials = materialsQuery.data ?? []

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-fg">Startup Materials</h2>
        {canManage && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            Add Material
          </Button>
        )}
      </div>

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
              onDelete={() => deleteMutation.mutate(m.id)}
              deleting={deleteMutation.isPending && deleteMutation.variables === m.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 py-6 text-fg-muted">
          <FolderOpen className="size-5" />
          <p className="text-sm">No startup materials added yet.</p>
        </div>
      )}

      {formOpen && (
        <StartupMaterialFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          startupId={startupId}
          editing={editing}
        />
      )}
    </Card>
  )
}
