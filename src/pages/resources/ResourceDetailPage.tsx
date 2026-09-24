import type { ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Bookmark, Download, ChevronRight } from 'lucide-react'
import { getResource, listResources, toggleSaveResource, downloadResource } from '@/services/resources.service'
import { ResourceCard } from '@/components/domain/ResourceCard'
import { ResourceThumbnail } from '@/components/domain/ResourceThumbnail'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { RESOURCE_TYPES, categoryMeta, fileExtension, formatDuration, hostedKind, youtubeId } from '@/lib/resource-catalog'
import { cn, formatRelativeTime, resolveResourceHref } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Resource } from '@/types'

/** The big picture at the top: a playable video where one exists, otherwise the resource's image. */
function ResourceMedia({ resource }: { resource: Resource }) {
  const youtube = youtubeId(resource.url)
  const kind = hostedKind(resource)

  if (youtube) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-border/80 bg-black shadow-xs">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtube}`}
          title={resource.title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          className="size-full border-0"
        />
      </div>
    )
  }
  if (kind === 'video' && resource.previewable) {
    return (
      <video
        controls
        preload="metadata"
        poster={resource.thumbnailUrl}
        src={resource.url}
        className="aspect-video w-full rounded-xl border border-border/80 bg-black shadow-xs"
      >
        Your browser can't play this video — use Download instead.
      </video>
    )
  }
  if (kind === 'image' && !resource.thumbnailUrl) {
    return <img src={resource.url} alt={resource.title} className="max-h-[32rem] w-full rounded-xl border border-border/80 bg-surface-sunken object-contain shadow-xs" />
  }
  return <ResourceThumbnail resource={resource} className="aspect-video rounded-xl border border-border/80 shadow-xs" />
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-fg">{children}</dd>
    </div>
  )
}

/**
 * Members can open, download and save a resource — never edit or delete it (the library is curated by
 * admins). "Open" shows a hosted file in the browser without downloading it (PDF, image, video, text);
 * "Download" saves it to the device. Files a browser can't display (Word, Excel, ZIP, ...) only get
 * Download, and a link resource only gets an "open the link" button.
 */
export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: resource, isLoading, isError, refetch } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => getResource(id!),
    enabled: !!id,
  })

  const category = resource?.category
  const { data: more } = useQuery({
    queryKey: ['resources', 'more-in', category],
    queryFn: () => listResources({ category, size: 4 }),
    enabled: !!category,
  })

  const saveMutation = useMutation({
    mutationFn: () => toggleSaveResource(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource', id] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })

  const downloadMutation = useMutation({
    mutationFn: () => downloadResource(resource!),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not download this file'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-video w-full max-w-3xl rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    )
  }

  if (isError || !resource) {
    return <ErrorState title="Couldn’t load this resource" onRetry={refetch} />
  }

  const type = RESOURCE_TYPES[resource.type] ?? RESOURCE_TYPES.Link
  const TypeIcon = type.icon
  const shelf = categoryMeta(resource.category)
  const resolved = resolveResourceHref(resource.url)
  const isFile = !!resource.fileName
  const duration = formatDuration(resource.durationMinutes)
  const related = (more ?? []).filter((r) => r.id !== resource.id).slice(0, 3)
  const linkLabel = youtubeId(resource.url) ? 'Watch on YouTube' : type.action

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <Link to="/resources" className="transition-colors hover:text-fg">
          Resources
        </Link>
        {shelf && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <Link to={`/resources?category=${shelf.key}`} className="transition-colors hover:text-fg">
              {shelf.label}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="max-w-xs truncate text-fg">{resource.title}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <ResourceMedia resource={resource} />

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface-sunken px-2 py-0.5 text-xs font-medium leading-none text-fg-secondary">
                <TypeIcon className="size-3" />
                {resource.type}
              </span>
              {shelf && (
                <Link to={`/resources?category=${shelf.key}`}>
                  <Badge tone="brand">{shelf.label}</Badge>
                </Link>
              )}
              {resource.featured && <Badge tone="accent">Featured</Badge>}
            </div>
            <h1 className="text-2xl font-black leading-snug tracking-tight text-fg sm:text-3xl">{resource.title}</h1>
            {resource.provider && <p className="mt-1 text-sm font-medium text-fg-muted">{resource.provider}</p>}
            {resource.description && (
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-fg-secondary sm:text-base">{resource.description}</p>
            )}
            {resource.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {resource.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
            {isFile ? (
              <>
                {resource.previewable && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Button leftIcon={<ExternalLink className="size-4" />}>Open</Button>
                  </a>
                )}
                <Button
                  variant={resource.previewable ? 'secondary' : undefined}
                  isLoading={downloadMutation.isPending}
                  leftIcon={<Download className="size-4" />}
                  onClick={() => downloadMutation.mutate()}
                >
                  Download
                </Button>
              </>
            ) : !resolved.href ? (
              <Button leftIcon={<ExternalLink className="size-4" />} disabled>
                No destination set
              </Button>
            ) : resolved.external ? (
              <a href={resolved.href} target="_blank" rel="noopener noreferrer">
                <Button leftIcon={<ExternalLink className="size-4" />}>{linkLabel}</Button>
              </a>
            ) : (
              <Link to={resolved.href}>
                <Button leftIcon={<ExternalLink className="size-4" />}>{linkLabel}</Button>
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

          {isFile && !resource.previewable && (
            <p className="-mt-2 text-xs text-fg-muted">This file type can’t be previewed in the browser — download it to open it.</p>
          )}
        </div>

        <aside>
          <Card className="rounded-xl border border-border/80 bg-surface p-5 shadow-xs">
            <h2 className="text-sm font-bold tracking-tight text-fg">About this resource</h2>
            <dl className="mt-2 divide-y divide-border/60">
              <DetailRow label="Type">{resource.type}</DetailRow>
              {shelf && (
                <DetailRow label="Shelf">
                  <Link to={`/resources?category=${shelf.key}`} className="hover:underline">
                    {shelf.label}
                  </Link>
                </DetailRow>
              )}
              {resource.provider && <DetailRow label="Source">{resource.provider}</DetailRow>}
              {duration && <DetailRow label="Duration">{duration}</DetailRow>}
              {isFile && <DetailRow label="Format">{fileExtension(resource.fileName).toUpperCase()}</DetailRow>}
              {resource.chapterName && (
                <DetailRow label="Chapter">
                  <Link to={`/chapters/${resource.chapterId}`} className="hover:underline">
                    {resource.chapterName}
                  </Link>
                </DetailRow>
              )}
              <DetailRow label="Added">{formatRelativeTime(resource.createdAt)}</DetailRow>
            </dl>
          </Card>
        </aside>
      </div>

      {shelf && related.length > 0 && (
        <section aria-labelledby="more-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="more-heading" className="text-xl font-bold tracking-tight text-fg">
              More in {shelf.label}
            </h2>
            <Link to={`/resources?category=${shelf.key}`} className="text-sm font-semibold text-fg-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
