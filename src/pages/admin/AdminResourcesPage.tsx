import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteAdminResource, listAdminResources } from '@/services/admin.service'
import { AdminResourceFormModal } from '@/components/domain/AdminResourceFormModal'
import { ResourceThumbnail } from '@/components/domain/ResourceThumbnail'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <p className="text-sm text-fg-muted max-w-xl">
          Members can browse, open, download and save resources but cannot add or change them. Everything in the library is added here.
        </p>
        <Button leftIcon={<Plus className="size-4" />} onClick={() => setForm({})}>
          Add resource
        </Button>
      </div>

      <SearchFilterBar query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search resources by title or tag…" />
      <div className="mb-4 flex flex-wrap gap-3">
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
      </div>

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
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Shelf</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Chapter</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((resource) => (
                    <tr key={resource.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-fg max-w-sm">
                        <div className="flex items-center gap-3">
                          <ResourceThumbnail resource={resource} className="h-10 w-16 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <span className="block truncate">{resource.title}</span>
                            <span className="mt-0.5 flex items-center gap-1.5">
                              <Badge tone="neutral">{resource.type}</Badge>
                              {resource.featured && <Badge tone="accent">Featured</Badge>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{categoryMeta(resource.category)?.label ?? '—'}</td>
                      <td className="px-4 py-3 text-fg-muted truncate max-w-xs">{sourceLabel(resource)}</td>
                      <td className="px-4 py-3 text-fg-muted">{resource.chapterName ?? 'All members'}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatRelativeTime(resource.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-fg-brand hover:underline"
                          >
                            Open <ExternalLink className="size-3" />
                          </a>
                          <Button size="sm" variant="secondary" leftIcon={<Pencil className="size-3.5" />} onClick={() => setForm({ resource })}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger-subtle" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setDeleting(resource)}>
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
    </div>
  )
}
