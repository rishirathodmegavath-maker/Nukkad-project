import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/store/toast.store'

const CATEGORIES = [
  'Nudity or sexual activity',
  'Hate speech or symbols',
  'Scam or fraud',
  'Violence or dangerous organizations',
  'Sale of illegal or regulated goods',
  'Bullying or harassment',
  'Pretending to be someone else',
  'Intellectual property violation',
  'Suicide or self-injury',
  'Spam',
  "The problem isn't listed here",
  'Report as unlawful',
]

interface ReportModalProps {
  open: boolean
  onClose: () => void
  reportedUserId: string
  conversationId?: string
  postId?: string
}

export function ReportModal({ open, onClose, reportedUserId, conversationId, postId }: ReportModalProps) {
  const [category, setCategory] = useState<string | null>(null)

  const submitMutation = useMutation({
    mutationFn: () => apiClient.post('/reports', { reportedUserId, category: category!, conversationId, postId }),
    onSuccess: () => {
      toast.success("Thanks — your report was submitted and we'll take a look.")
      handleClose()
    },
    onError: () => toast.error('Could not submit report — try again.'),
  })

  function handleClose() {
    setCategory(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={category ? 'Confirm report' : 'Report'} size="sm">
      {!category ? (
        <div className="flex flex-col -mx-5 -mb-5">
          <p className="px-5 pb-2 text-sm font-semibold text-fg">Select a problem to report</p>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-fg hover:bg-surface-hover cursor-pointer border-t border-border-subtle text-left"
            >
              {c}
              <ChevronRight className="size-4 text-fg-muted shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCategory(null)}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg cursor-pointer self-start"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <p className="text-sm text-fg">
            Report this {postId ? 'post' : 'account'} for <span className="font-semibold">{category}</span>?
          </p>
          <p className="text-xs text-fg-muted">Our team will review this report. Thanks for helping keep BuildAdda safe.</p>
          <Button isLoading={submitMutation.isPending} onClick={() => submitMutation.mutate()} className="self-end">
            Submit report
          </Button>
        </div>
      )}
    </Modal>
  )
}
