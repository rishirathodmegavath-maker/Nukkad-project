import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { bulkDeleteAdminResources, deleteAdminResource, listAdminResources } from '@/services/admin.service'
import { AdminResourceFormModal } from '@/components/domain/AdminResourceFormModal'
import { ResourceThumbnail } from '@/components/domain/ResourceThumbnail'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Select } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { useRowSelection } from '@/hooks/useRowSelection'
import { isAllVisibleSelected, isAnyVisibleSelected } from '@/lib/rowSelection'
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_ORDER, categoryMeta, isCategory } from '@/lib/resource-catalog'
import { formatRelativeTime } from '@/lib/utils'
import type { Resource, ResourceCategory, ResourceType } from '@/types'

/** Where a resource points, for the "Source" column. */
function sourceLabel(resource: Resource): string {
  if (resource.fileName) return `File · ${resource.fileName}`
  try {
    return `Link · ${new URL(resource.url).host}`
  } catch {
    return `Link · ${resource.url}`
  }
}

/** The resource library is curated here and only here: members can browse, open, download and save. */
export default function AdminResourcesPage() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState<{ resource?: Resource } | null>(null)
  const [deleting, setDeleting] = useState<Resource | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const { selectedIds, handleRowClick, toggleSelectAllVisible, clearSelection, removeFromSelection, clearAnchor } = useRowSelection()
  const selectAllRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const filters = useMemo(
    () => ({
      q: q || undefined,
      type: (type || undefined) as ResourceType | undefined,
      category: (isCategory(category) ? category : undefined) as ResourceCategory | undefined,
      page,
      size: 20,
    }),
    [q, type, category, page],
  )

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'resources', filters],
    queryFn: () => listAdminResources(filters),
  })
  // The order actually rendered right now — shift-range selection and "select all" only ever
  // operate over this, never a server-side page that isn't loaded.
  const visibleIds = useMemo(() => data?.content.map((r) => r.id) ?? [], [data])
  const allVisibleSelected = isAllVisibleSelected(selectedIds, visibleIds)
  const someVisibleSelected = isAnyVisibleSelected(selectedIds, visibleIds)
  // `indeterminate` has no HTML attribute form — it's a DOM-only property, so it's set imperatively
  // rather than as a JSX prop.
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected
  }, [someVisibleSelected, allVisibleSelected])

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminResource(deleting!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Resource deleted')
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete this resource'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminResources(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success(`${ids.length} resource${ids.length === 1 ? '' : 's'} deleted`)
      removeFromSelection(ids)
      clearAnchor()
      setBulkDeleteOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete the selected resources'),
  })

  return (
    <div>
      <SearchFilterBar inline query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search resources by title or tag…">
        <Select aria-label="Filter by type" value={type} onChange={(e) => { setType(e.target.value); setPage(0) }} className="w-44">
          <option value="">All types</option>
          {RESOURCE_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by shelf" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0) }} className="w-52">
          <option value="">All shelves</option>
          {RESOURCE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setForm({})}>
          Add resource
        </Button>
      </SearchFilterBar>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-sunken/50 px-4 py-2.5">
          <p className="text-sm font-medium text-fg">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" variant="danger-subtle" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load resources" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="size-5" />}
          title={q || type || category ? 'No resources match' : 'No resources yet'}
          description={q || type || category ? undefined : 'Add the first template, guide or link for members.'}
          action={
            q || type || category ? undefined : (
              <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setForm({})}>
                Add resource
              </Button>
            )
          }
        />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="px-4 py-3">
                      <Checkbox
                        ref={selectAllRef}
                        aria-label={allVisibleSelected ? 'Deselect all resources on this page' : 'Select all resources on this page'}
                        checked={allVisibleSelected}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.preventDefault()
                          toggleSelectAllVisible(visibleIds)
                        }}
                      />
                    </th>
                    <th className="w-full min-w-[13rem] px-4 py-3">Title</th>
                    <th className="px-4 py-3">Shelf</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Chapter</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="bg-surface px-4 py-3 md:sticky md:right-0" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((resource) => (
                    <tr key={resource.id} className="group border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox
                          aria-label={`Select ${resource.title}`}
                          checked={selectedIds.has(resource.id)}
                          onChange={() => {}}
                          onClick={(e) => {
                            e.preventDefault()
                            handleRowClick(resource.id, visibleIds, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey })
                          }}
                        />
                      </td>
                      {/* w-full + max-w-0: the title column takes the spare width (and truncates), so the
                          other columns and the actions sit together instead of drifting apart. min-w keeps
                          the title readable when the table is tight. */}
                      <td className="w-full min-w-[13rem] max-w-0 px-4 py-3 font-medium text-fg">
                        <div className="flex items-center gap-3">
                          <ResourceThumbnail resource={resource} className="h-10 w-16 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <span className="block truncate" title={resource.title}>{resource.title}</span>
                            <span className="mt-0.5 flex items-center gap-1.5">
                              <Badge tone="neutral">{resource.type}</Badge>
                              {resource.featured && <Badge tone="accent">Featured</Badge>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{categoryMeta(resource.category)?.label ?? '—'}</td>
                      <td className="px-4 py-3 text-fg-muted truncate max-w-[9rem]" title={sourceLabel(resource)}>
                        {sourceLabel(resource)}
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{resource.chapterName ?? 'All members'}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(resource.createdAt)}</td>
                      <td className="bg-surface px-4 py-3 text-right transition-colors group-hover:bg-surface-hover md:sticky md:right-0">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${resource.title} in a new tab`}
                            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                          >
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                            Open
                          </a>
                          <Button
                            size="sm"
                            variant="secondary"
                            aria-label={`Edit ${resource.title}`}
                            leftIcon={<Pencil className="size-3.5" />}
                            onClick={() => setForm({ resource })}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger-subtle"
                            aria-label={`Delete ${resource.title}`}
                            leftIcon={<Trash2 className="size-3.5" />}
                            onClick={() => setDeleting(resource)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      {form && <AdminResourceFormModal resource={form.resource} onClose={() => setForm(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this resource?"
        description={deleting ? `"${deleting.title}" will be removed for every member.${deleting.fileName ? ' The uploaded file is deleted too.' : ''} This can't be undone.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete resource
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">The action is recorded in the audit log.</p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedIds.size} resource${selectedIds.size === 1 ? '' : 's'}?`}
        description="This permanently removes the selected resources (and their uploaded files, where hosted) for every member. This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={bulkDeleteMutation.isPending} onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}>
              Delete {selectedIds.size} Resource{selectedIds.size === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">The action is recorded in the audit log, one entry per resource.</p>
      </Modal>
    </div>
  )
}
