import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** 0 to 100. Anything outside is clamped. */
  value: number
  /** What the bar measures, for screen readers, e.g. "Profile completion". */
  label: string
  tone?: 'brand' | 'success'
  className?: string
}

/** A thin horizontal bar for a real percentage (profile completion, funds raised). */
export function ProgressBar({ value, label, tone = 'brand', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-sunken', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', tone === 'success' ? 'bg-success-500' : 'bg-brand-500')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
