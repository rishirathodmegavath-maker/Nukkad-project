import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/** Shared pre-publish approve/reject confirmation for the admin Ideas/Startups/Opportunities list
 *  pages — see IdeaService.reviewModeration (backend) for the moderation model this drives.
 *  Distinct from AdminRemoveContentModal, which handles the separate, reactive remove/restore
 *  action on content that's already been approved and published. */
export function AdminReviewContentModal({
  open,
  onClose,
  itemLabel,
  approving,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  itemLabel: string
  /** true = confirming an approval, false = confirming a rejection. */
  approving: boolean
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={approving ? `Approve "${itemLabel}"?` : `Reject "${itemLabel}"?`}
      description={
        approving
          ? 'This publishes it to public discovery immediately and notifies the person who submitted it.'
          : 'This keeps it hidden from public discovery and notifies the person who submitted it, with your reason.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={approving ? 'primary' : 'danger'}
            isLoading={isPending}
            disabled={!approving && reason.trim().length === 0}
            onClick={() => onConfirm(reason)}
          >
            {approving ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      {!approving && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rejection-reason" className="text-sm font-medium text-fg">
            Reason (shown to the person who submitted it, and recorded in the audit log)
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="e.g. incomplete details, doesn't meet community guidelines"
          />
        </div>
      )}
    </Modal>
  )
}
