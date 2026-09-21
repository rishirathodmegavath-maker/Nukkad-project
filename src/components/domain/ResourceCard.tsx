import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Resource } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { ResourceThumbnail } from '@/components/domain/ResourceThumbnail'
import { RESOURCE_TYPES, formatDuration } from '@/lib/resource-catalog'
import { toggleSaveResource } from '@/services/resources.service'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast.store'

/**
 * A library entry as a card: picture on top, then title, source, a two-line description and topic tags.
 * The whole card opens the resource (the title link is stretched over it); the save button sits above that.
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const type = RESOURCE_TYPES[resource.type] ?? RESOURCE_TYPES.Link
  const TypeIcon = type.icon
  const duration = formatDuration(resource.durationMinutes)
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: () => toggleSaveResource(resource.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', resource.id] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update save'),
  })

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-within:ring-2 focus-within:ring-brand-500/40">
      <div className="relative">
        <ResourceThumbnail resource={resource} className="aspect-video" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-surface/90 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-fg-secondary shadow-xs backdrop-blur-sm">
          <TypeIcon className="size-3.5" />
          {resource.type}
        </span>
        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          aria-label={resource.isSaved ? 'Remove from saved' : 'Save resource'}
          className={cn(
            'absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg bg-surface/90 shadow-xs backdrop-blur-sm transition-colors cursor-pointer disabled:opacity-50',
            resource.isSaved ? 'text-amber-500' : 'text-fg-muted hover:text-amber-500',
          )}
        >
          <Bookmark className={cn('size-4', resource.isSaved && 'fill-current')} />
        </button>
        {duration && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
            {duration}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-fg">
            <Link to={`/resources/${resource.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
              {resource.title}
            </Link>
          </h3>
          {resource.provider && <p className="mt-0.5 truncate text-xs font-medium text-fg-muted">{resource.provider}</p>}
        </div>

        {resource.description && <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted">{resource.description}</p>}

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-fg-brand">
          {resource.fileName ? 'View resource' : type.action}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  )
}
