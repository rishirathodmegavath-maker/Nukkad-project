import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Clock, XCircle } from 'lucide-react'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/domain/PageHeader'
import { getMyInvestorActivation, submitInvestorActivation } from '@/services/investors.service'
import { toast } from '@/store/toast.store'
import type { InvestorType } from '@/types'

const TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']

export default function InvestorProfileFormPage() {
  const navigate = useNavigate()
  const [investorType, setInvestorType] = useState<InvestorType>('Angel')
  const [firmName, setFirmName] = useState('')
  const [thesis, setThesis] = useState('')
  const [sectors, setSectors] = useState<string[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [geographies, setGeographies] = useState<string[]>([])
  const [ticketMin, setTicketMin] = useState('')
  const [ticketMax, setTicketMax] = useState('')
  const [portfolioCount, setPortfolioCount] = useState('')
  const [website, setWebsite] = useState('')

  const activationQuery = useQuery({ queryKey: ['investors', 'activation', 'me'], queryFn: getMyInvestorActivation })

  const mutation = useMutation({
    mutationFn: () =>
      submitInvestorActivation({
        investorType,
        firmName: firmName || undefined,
        thesis: thesis || undefined,
        sectors,
        stages,
        geographies,
        ticketMin: ticketMin ? Number(ticketMin) : undefined,
        ticketMax: ticketMax ? Number(ticketMax) : undefined,
        portfolioCount: portfolioCount ? Number(portfolioCount) : undefined,
        website: website || undefined,
      }),
    onSuccess: () => {
      toast.success('Application submitted — an admin will review it')
      activationQuery.refetch()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit your application'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (activationQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const latest = activationQuery.data

  if (latest?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Investor application" description="Your application is being reviewed." />
        <Card className="flex items-center gap-3 border border-warning-500/30 bg-warning-500/5">
          <Badge tone="warning"><Clock className="size-3" /> Pending review</Badge>
          <p className="text-sm text-fg-secondary">
            We'll notify you once an admin has reviewed your investor application.
          </p>
        </Card>
      </div>
    )
  }

  if (latest?.status === 'APPROVED' && latest.resultingProfileId) {
    navigate(`/investors/${latest.resultingProfileId}`, { replace: true })
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Activate your investor profile"
        description="Your name, photo and headline come from your BuildAdda profile — this just adds your investing details. An admin reviews every application before it goes live."
      />

      {latest?.status === 'REJECTED' && (
        <Card className="flex items-center gap-3 border border-danger-500/30 bg-danger-500/5 mb-5">
          <Badge tone="danger"><XCircle className="size-3" /> Not approved</Badge>
          <p className="text-sm text-fg-secondary">{latest.reviewNote ?? 'Your previous application was not approved.'} You can update your details and apply again below.</p>
        </Card>
      )}

      <Card className="rounded-xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Investor type" value={investorType} onChange={(e) => setInvestorType(e.target.value as InvestorType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input label="Firm" value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="e.g. Sequoia, or blank if angel" />
          </div>

          <Textarea
            label="Investment thesis"
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="What do you look for in founders and startups?"
          />

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Sectors</p>
            <TagInput value={sectors} onChange={setSectors} placeholder="Add a sector and press Enter…" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Stage preference</p>
            <TagInput value={stages} onChange={setStages} placeholder="e.g. Idea, MVP, Growth…" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Geography</p>
            <TagInput value={geographies} onChange={setGeographies} placeholder="Add a region and press Enter…" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Min ticket" type="number" min={0} value={ticketMin} onChange={(e) => setTicketMin(e.target.value)} placeholder="e.g. 50000" />
            <Input label="Max ticket" type="number" min={0} value={ticketMax} onChange={(e) => setTicketMax(e.target.value)} placeholder="e.g. 500000" />
            <Input label="Portfolio size" type="number" min={0} value={portfolioCount} onChange={(e) => setPortfolioCount(e.target.value)} placeholder="e.g. 12" />
          </div>
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate('/investors')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={mutation.isPending}>
              {latest?.status === 'REJECTED' ? 'Re-submit application' : 'Submit application'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
