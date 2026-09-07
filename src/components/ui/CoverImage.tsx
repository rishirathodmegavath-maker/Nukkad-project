import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CoverImageProps {
  src?: string | null
  alt: string
  className?: string
  /** Rendered instead of the default gradient placeholder when there's no image, or it fails to load. */
  fallback?: ReactNode
}

/**
 * A cover/banner image with a graceful fallback — generalizes the onError pattern already used by
 * Avatar for profile photos. A missing URL and a broken one (404, CORS, CSP-blocked) both fall
 * through to the same placeholder instead of a browser broken-image icon.
 */
export function CoverImage({ src, alt, className, fallback }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  if (src !== lastSrc) {
    setLastSrc(src)
    setFailed(false)
  }

  const showImage = !!src && !failed

  if (showImage) {
    return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />
  }

  return (
    <>{fallback ?? <div className={cn('bg-gradient-to-br from-brand-500/10 via-surface-sunken to-accent-500/10', className)} />}</>
  )
}
