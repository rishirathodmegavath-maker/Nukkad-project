import { useState } from 'react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'size-9 rounded-lg text-sm',
  md: 'size-11 rounded-xl text-base',
  lg: 'size-14 rounded-xl text-xl',
  xl: 'size-20 rounded-2xl text-3xl',
}

interface EntityLogoProps {
  src?: string
  /** The company or startup name: the picture's alt text, and the first letter shown when there is no picture. */
  name: string
  size?: keyof typeof sizeClasses
  className?: string
}

/** A company / startup logo: the uploaded image, or its first letter on the brand tint when there is none (or it fails to load). */
export function EntityLogo({ src, name, size = 'md', className }: EntityLogoProps) {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setFailed(false)
  }

  const shape = cn('shrink-0 border border-border/70 shadow-2xs', sizeClasses[size], className)

  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className={cn(shape, 'object-cover bg-surface-sunken')} />
  }
  return (
    <span
      aria-hidden="true"
      className={cn(shape, 'flex select-none items-center justify-center bg-brand-500/10 font-bold text-fg-brand')}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
