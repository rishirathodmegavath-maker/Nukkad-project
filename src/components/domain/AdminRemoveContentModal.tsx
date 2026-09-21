import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/** Shared remove/restore confirmation for the admin Ideas/Startups/Opportunities list pages — see
 *  IdeaService.setRemovedByAdmin (backend) for the moderation model this drives. */
export function AdminRemoveContentModal({
  open,
  onClose,
  itemLabel,
  targetRemoved,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  itemLabel: string
  /** true = confirming a removal, false = confirming a restore. */
  targetRemoved: boolean
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={targetRemoved ? `Remove "${itemLabel}"?` : `Restore "${itemLabel}"?`}
      description={
        targetRemoved
          ? 'This hides it from public discovery and its public page immediately. It is not deleted, and can be restored at any time.'
          : 'This makes it visible again in public discovery and on its public page.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={targetRemoved ? 'danger' : 'primary'} isLoading={isPending} onClick={() => onConfirm(reason)}>
            {targetRemoved ? 'Remove' : 'Restore'}
          </Button>
        </>
      }
    >
      {targetRemoved && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="removal-reason" className="text-sm font-medium text-fg">
            Reason (recorded in the audit log)
          </label>
          <textarea
            id="removal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="e.g. fraudulent claims, policy violation"
          />
        </div>
      )}
    </Modal>
  )
}
