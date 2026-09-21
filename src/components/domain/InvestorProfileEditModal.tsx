import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { updateInvestorProfile } from '@/services/investors.service'
import { toast } from '@/store/toast.store'
import type { InvestorProfile, InvestorType } from '@/types'

const TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']

export function InvestorProfileEditModal({ open, onClose, investor }: { open: boolean; onClose: () => void; investor: InvestorProfile }) {
  const queryClient = useQueryClient()
  const [investorType, setInvestorType] = useState<InvestorType>(investor.investorType)
  const [firmName, setFirmName] = useState(investor.firmName ?? '')
  const [thesis, setThesis] = useState(investor.thesis ?? '')
  const [sectors, setSectors] = useState<string[]>(investor.sectors)
  const [stages, setStages] = useState<string[]>(investor.stages)
  const [geographies, setGeographies] = useState<string[]>(investor.geographies)
  const [ticketMin, setTicketMin] = useState(investor.ticketMin !== undefined ? String(investor.ticketMin) : '')
  const [ticketMax, setTicketMax] = useState(investor.ticketMax !== undefined ? String(investor.ticketMax) : '')
  const [portfolioCount, setPortfolioCount] = useState(String(investor.portfolioCount))
  const [website, setWebsite] = useState(investor.website ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      updateInvestorProfile(investor.id, {
        investorType,
        firmName,
        thesis,
        sectors,
        stages,
        geographies,
        ticketMin: ticketMin ? Number(ticketMin) : undefined,
        ticketMax: ticketMax ? Number(ticketMax) : undefined,
        portfolioCount: portfolioCount ? Number(portfolioCount) : undefined,
        website,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', investor.id] })
      queryClient.invalidateQueries({ queryKey: ['investors'] })
      toast.success('Investor profile updated')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your investor profile'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit investor profile" size="lg">
      <div className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Investor type" value={investorType} onChange={(e) => setInvestorType(e.target.value as InvestorType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input label="Firm" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
        </div>

        <Textarea label="Investment thesis" value={thesis} onChange={(e) => setThesis(e.target.value)} rows={3} />

        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Sectors</p>
          <TagInput value={sectors} onChange={setSectors} placeholder="Add a sector and press Enter…" maxLength={100} />
        </div>
        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Stage preference</p>
          <TagInput value={stages} onChange={setStages} placeholder="e.g. Idea, MVP, Growth…" maxLength={50} />
        </div>
        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Geography</p>
          <TagInput value={geographies} onChange={setGeographies} placeholder="Add a region and press Enter…" maxLength={100} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Min ticket" type="number" min={0} value={ticketMin} onChange={(e) => setTicketMin(e.target.value)} />
          <Input label="Max ticket" type="number" min={0} value={ticketMax} onChange={(e) => setTicketMax(e.target.value)} />
          <Input label="Portfolio size" type="number" min={0} value={portfolioCount} onChange={(e) => setPortfolioCount(e.target.value)} />
        </div>
        <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />

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
