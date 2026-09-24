import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateFundraise } from '@/services/investors.service'
import { toast } from '@/store/toast.store'
import type { Fundraise, StartupStage } from '@/types'

const STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

export function FundraiseEditModal({ open, onClose, fundraise }: { open: boolean; onClose: () => void; fundraise: Fundraise }) {
  const queryClient = useQueryClient()
  const [targetAmount, setTargetAmount] = useState(String(fundraise.targetAmount))
  const [amountRaised, setAmountRaised] = useState(String(fundraise.amountRaised))
  const [fundingStage, setFundingStage] = useState<StartupStage>(fundraise.fundingStage as StartupStage)
  const [useOfFunds, setUseOfFunds] = useState(fundraise.useOfFunds ?? '')
  const [minimumTicket, setMinimumTicket] = useState(fundraise.minimumTicket !== undefined ? String(fundraise.minimumTicket) : '')

  const mutation = useMutation({
    mutationFn: () =>
      updateFundraise(fundraise.id, {
        targetAmount: Number(targetAmount),
        amountRaised: Number(amountRaised),
        fundingStage,
        useOfFunds,
        minimumTicket: minimumTicket ? Number(minimumTicket) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraise', fundraise.id] })
      queryClient.invalidateQueries({ queryKey: ['fundraise', 'by-startup', fundraise.startupId] })
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this fundraise'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit fundraise" size="lg">
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Target amount" type="number" min={1} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
          <Input label="Amount raised" type="number" min={0} value={amountRaised} onChange={(e) => setAmountRaised(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Stage" value={fundingStage} onChange={(e) => setFundingStage(e.target.value as StartupStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input label="Minimum ticket" type="number" min={0} value={minimumTicket} onChange={(e) => setMinimumTicket(e.target.value)} />
        </div>
        <Textarea label="Use of funds" value={useOfFunds} onChange={(e) => setUseOfFunds(e.target.value)} />

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
