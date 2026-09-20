import { cn } from '@/lib/utils'
// Imported (not referenced from /public) so the build gives it a content-hashed filename: a returning
// visitor can never be served a stale cached copy of the old logo.
import logoUrl from '@/assets/logo.png'

const sizeClasses = {
  sm: 'size-8',
  md: 'size-9',
}

interface LogoProps {
  size?: keyof typeof sizeClasses
  className?: string
}

/** Brand mark. The artwork is already a self-contained rounded square, so it is shown as-is — no chip,
 *  stroke, shadow or tint behind it (per the logo pack's usage rules). */
export function Logo({ size = 'sm', className }: LogoProps) {
  return <img src={logoUrl} alt="BuildAdda" className={cn('shrink-0', sizeClasses[size], className)} />
}
