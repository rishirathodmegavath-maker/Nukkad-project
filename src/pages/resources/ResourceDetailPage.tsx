import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Link2, Video, StickyNote, LayoutTemplate, ExternalLink, Bookmark, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { getResource, toggleSaveResource, deleteResource } from '@/services/resources.service'
import { useUser } from '@/hooks/useUser'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ResourceEditModal } from '@/components/domain/ResourceEditModal'
import { cn, resolveResourceHref } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Resource } from '@/types'

const typeIcon: Record<Resource['type'], typeof FileText> = {
  Document: FileText,
  Link: Link2,
  Video: Video,
  Note: StickyNote,
  Template: LayoutTemplate,
}

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: resource, isLoading, isError, refetch } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => getResource(id!),
    enabled: !!id,
  })

  const { data: uploader } = useUser(resource?.uploaderUserId)

  const saveMutation = useMutation({
    mutationFn: () => toggleSaveResource(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['resource', id] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success(result.saved ? 'Saved' : 'Removed from saved')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteResource(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      if (resource?.chapterId) queryClient.invalidateQueries({ queryKey: ['chapter', resource.chapterId] })
      toast.info('Resource deleted')
      navigate(resource?.chapterId ? `/chapters/${resource.chapterId}` : '/resources')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete resource')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !resource) {
    return <ErrorState title="Couldn’t load this resource" onRetry={refetch} />
  }

  const Icon = typeIcon[resource.type]
  const resolved = resolveResourceHref(resource.url)

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/resources" className="hover:text-fg transition-colors">
          Resources
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{resource.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-fg tracking-tight leading-snug">{resource.title}</h1>
                  <Badge tone="neutral" className="mt-1">{resource.type}</Badge>
                </div>
              </div>
              {resource.canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger-subtle"
                    size="sm"
                    leftIcon={<Trash2 className="size-3.5" />}
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {resource.chapterName && (
              <Link to={`/chapters/${resource.chapterId}`} className="text-sm font-semibold text-fg hover:underline mb-2 inline-block">
                Chapter: {resource.chapterName}
              </Link>
            )}

            <p className="text-sm sm:text-base text-fg-secondary leading-relaxed mt-3 whitespace-pre-line">{resource.description}</p>

            {resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {resource.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border/60">
              {!resolved.href ? (
                <Button leftIcon={<ExternalLink className="size-4" />} disabled>
                  No destination set
                </Button>
              ) : resolved.external ? (
                <a href={resolved.href} target="_blank" rel="noopener noreferrer">
                  <Button leftIcon={<ExternalLink className="size-4" />}>Open resource</Button>
                </a>
              ) : (
                <Link to={resolved.href}>
                  <Button leftIcon={<ExternalLink className="size-4" />}>Open resource</Button>
                </Link>
              )}
              <Button
                variant="secondary"
                isLoading={saveMutation.isPending}
                leftIcon={<Bookmark className={cn('size-4', resource.isSaved && 'fill-current text-amber-500')} />}
                onClick={() => saveMutation.mutate()}
              >
                {resource.isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {uploader && (
            <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface flex flex-col gap-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-fg-muted">Shared by</h2>
              <Link to={`/people/${uploader.id}`} className="flex items-center gap-2.5 group">
                <Avatar src={uploader.avatarUrl} name={uploader.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg group-hover:underline truncate">{uploader.name}</p>
                  <p className="text-xs text-fg-muted truncate">{uploader.headline}</p>
                </div>
              </Link>
            </Card>
          )}
        </div>
      </div>

      <ResourceEditModal open={editOpen} onClose={() => setEditOpen(false)} resource={resource} />

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this resource?"
        description={`"${resource.title}" will be removed for everyone. This can't be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete resource
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">This action is permanent.</p>
      </Modal>
    </div>
  )
}
