import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RESOURCE_TYPES, UNFILED_GRADIENT, categoryMeta, resourceThumbnail } from '@/lib/resource-catalog'
import type { Resource } from '@/types'

/**
 * The picture for a resource: its uploaded image, the poster of a YouTube link, or — when there is none
 * or it fails to load — a soft gradient in its shelf's colour with the type's icon. Size it from outside
 * (`className`), typically with an aspect ratio; the picture always fills it.
 */
export function ResourceThumbnail({ resource, className }: { resource: Resource; className?: string }) {
  const src = resourceThumbnail(resource)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!src && failedSrc !== src

  const Icon = RESOURCE_TYPES[resource.type]?.icon ?? RESOURCE_TYPES.Link.icon
  const gradient = categoryMeta(resource.category)?.gradient ?? UNFILED_GRADIENT

  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', className)}>
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn('absolute inset-0 flex items-center justify-center bg-gradient-to-br', gradient)}>
          <span className="flex size-14 items-center justify-center rounded-xl bg-surface/80 text-fg-secondary shadow-xs backdrop-blur-sm">
            <Icon className="size-7" strokeWidth={1.6} />
          </span>
        </div>
      )}
    </div>
  )
}
