import { Link } from 'react-router-dom'
import { EyeOff } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button-styles'

interface ContentUnavailableProps {
  /** "opportunity", "idea": what the person was looking for. */
  noun: string
  browseTo: string
  browseLabel: string
}

/**
 * Shown when the server answers "there is no such thing for you". That is the same answer for something deleted, taken
 * down by an admin, or submitted but not yet approved (only its poster can see it until then), so the message names the
 * likely reasons instead of pretending a retry will help.
 */
export function ContentUnavailable({ noun, browseTo, browseLabel }: ContentUnavailableProps) {
  return (
    <EmptyState
      icon={<EyeOff className="size-5" />}
      title={`This ${noun} isn’t available`}
      description={`It may still be waiting for review, or it may have been removed. If you posted it, it stays visible to you under your own postings.`}
      action={
        <Link to={browseTo} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
          {browseLabel}
        </Link>
      }
    />
  )
}
