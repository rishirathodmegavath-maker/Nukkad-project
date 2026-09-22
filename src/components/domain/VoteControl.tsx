import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteControlProps {
  netScore: number
  myVote: -1 | 0 | 1
  onVote: (direction: 'up' | 'down') => void
  pending?: boolean
  /** Compact for a list row; roomier for the detail page. */
  size?: 'sm' | 'md'
}

/** The up/down arrows + net score next to a discussion — a real signed score (SUM of every vote),
 *  never a fabricated "hot" number. Clicking the arrow you've already picked removes your vote. */
export function VoteControl({ netScore, myVote, onVote, pending, size = 'sm' }: VoteControlProps) {
  return (
    <div className={cn('flex flex-col items-center', size === 'sm' ? 'gap-0.5' : 'gap-1')}>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onVote('up')
        }}
        aria-label={myVote === 1 ? 'Remove upvote' : 'Upvote'}
        aria-pressed={myVote === 1}
        className={cn(
          'flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'size-6' : 'size-8',
          myVote === 1 ? 'text-fg-brand bg-brand-500/10' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
        )}
      >
        <ChevronUp className={size === 'sm' ? 'size-4' : 'size-5'} />
      </button>
      <span className={cn('font-bold tabular-nums text-fg', size === 'sm' ? 'text-sm' : 'text-base')}>{netScore}</span>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onVote('down')
        }}
        aria-label={myVote === -1 ? 'Remove downvote' : 'Downvote'}
        aria-pressed={myVote === -1}
        className={cn(
          'flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'size-6' : 'size-8',
          myVote === -1 ? 'text-danger-500 bg-danger-500/10' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
        )}
      >
        <ChevronDown className={size === 'sm' ? 'size-4' : 'size-5'} />
      </button>
    </div>
  )
}
