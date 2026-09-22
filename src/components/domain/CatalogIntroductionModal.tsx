import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { requestCatalogIntroduction } from '@/services/investor-catalog.service'
import { listMyFoundedStartups } from '@/services/startups.service'
import { toast } from '@/store/toast.store'
import type { CatalogInvestor } from '@/types'

/**
 * Request introduction from Investor Discovery. Only startups the founder manages (Founder/Admin) are offered —
 * the same tier the backend requires — since this is an outward-facing action on the startup's behalf.
 */
export function CatalogIntroductionModal({ investor, onClose }: { investor: CatalogInvestor; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [pickedStartupId, setPickedStartupId] = useState('')
  const [message, setMessage] = useState('')

  const { data: myStartups, isLoading } = useQuery({ queryKey: ['startups', 'me', 'founding'], queryFn: listMyFoundedStartups })
  // Defaults to the first managed startup without a render-then-effect round trip; the user can still switch it.
  const startupId = pickedStartupId || myStartups?.[0]?.id || ''

  const mutation = useMutation({
    mutationFn: () => requestCatalogIntroduction(investor.id, startupId, message.trim()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['intro-requests'] })
      if (result.kind === 'LIVE') {
        toast.success('Introduction requested')
      } else {
        toast.success(`Request sent — our team will help connect ${investor.name} with your startup.`)
      }
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send this request'),
  })

  const noManagedStartup = !isLoading && (myStartups?.length ?? 0) === 0

  return (
    <Modal
      open
      onClose={onClose}
      title={`Request an introduction to ${investor.name}`}
      description="Explain what you're looking for — this goes to our team, who help make the connection."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!startupId || !message.trim() || noManagedStartup} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Send request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {noManagedStartup ? (
          <p className="text-sm text-fg-muted">Only a founder or admin of a startup can request introductions.</p>
        ) : (
          <Select label="On behalf of" required value={startupId} onChange={(e) => setPickedStartupId(e.target.value)}>
            {(myStartups ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
        <Textarea
          label="Message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Why are you interested? What are you looking for?"
        />
      </div>
    </Modal>
  )
}
