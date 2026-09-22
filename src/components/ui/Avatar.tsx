import { useState } from 'react'
import { cn, initials } from '@/lib/utils'

const sizeClasses = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm font-medium',
  lg: 'size-14 text-base font-semibold',
  xl: 'size-20 text-xl font-bold',
  '2xl': 'size-24 text-2xl font-bold',
}

interface AvatarProps {
  src?: string
  name: string
  size?: keyof typeof sizeClasses
  online?: boolean
  ring?: boolean
  className?: string
}

export function Avatar({ src, name, size = 'md', online, ring, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  if (src !== lastSrc) {
    setLastSrc(src)
    setFailed(false)
  }

  const showImage = !!src && !failed

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center',
        sizeClasses[size],
        ring && 'ring-2 ring-brand-500/30 ring-offset-2 ring-offset-surface',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="size-full rounded-full object-cover bg-surface-sunken border border-border/70 shadow-xs"
        />
      ) : (
        /* dark:from-brand-950 used to be a no-op — brand's token ramp only goes to 900 — so the
           fallback gradient's first stop silently dropped out in dark mode. brand-900 is the
           deepest defined step. */
        <span aria-hidden="true" className="size-full rounded-full bg-gradient-to-br from-brand-100 to-brand-200/70 dark:from-brand-900 dark:to-brand-800/60 text-brand-700 dark:text-brand-300 flex items-center justify-center border border-brand-200/80 dark:border-brand-700/40 shadow-xs">
          {initials(name || '?')}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
      )}
    </span>
  )
}

