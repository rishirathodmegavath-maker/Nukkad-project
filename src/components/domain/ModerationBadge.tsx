import { Badge } from '@/components/ui/Badge'

/**
 * The review status of a member's own Idea / Startup / Opportunity, for cards and lists.
 *
 * Only the owner ever receives a non-approved item in a list — the API hides PENDING and REJECTED
 * content from everyone else — so rendering this whenever the status isn't APPROVED can't badge
 * anything public. APPROVED (and unknown) renders nothing.
 */
export function ModerationBadge({ status }: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  if (status === 'PENDING') {
    return (
      <span title="Only you can see this until an admin approves it" className="inline-flex max-w-full">
        <Badge tone="warning">Pending review</Badge>
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span title="Open it to see why it wasn't approved" className="inline-flex max-w-full">
        <Badge tone="danger">Not approved</Badge>
      </span>
    )
  }
  return null
}
