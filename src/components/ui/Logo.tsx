import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'size-8 p-1.5',
  md: 'size-9 p-1.5',
}

interface LogoProps {
  size?: keyof typeof sizeClasses
  className?: string
}

/** Brand mark — white chip behind the logo so the black artwork reads on any background (dark panels, brand-colored boxes, light surfaces alike). */
export function Logo({ size = 'sm', className }: LogoProps) {
  return (
    <span className={cn('flex items-center justify-center rounded-lg bg-white shrink-0', sizeClasses[size], className)}>
      <img src="/logo.png" alt="Buildadda" className="size-full object-contain" />
    </span>
  )
}
