import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { updateStartup } from '@/services/startups.service'
import { toast } from '@/store/toast.store'
import type { Startup, StartupStage, StartupVisibility } from '@/types'

const STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pt-1">
      <h3 className="text-sm font-bold text-fg">{title}</h3>
      {hint && <p className="text-xs text-fg-muted mt-0.5">{hint}</p>}
    </div>
  )
}

export function StartupEditModal({ open, onClose, startup }: { open: boolean; onClose: () => void; startup: Startup }) {
  const queryClient = useQueryClient()

  // Basic
  const [name, setName] = useState(startup.name)
  const [tagline, setTagline] = useState(startup.tagline)
  const [location, setLocation] = useState(startup.location)
  const [website, setWebsite] = useState(startup.website)
  const [sector, setSector] = useState(startup.sector)
  const [stage, setStage] = useState<StartupStage>(startup.stage)

  // Startup
  const [problem, setProblem] = useState(startup.problem)
  const [solution, setSolution] = useState(startup.solution)
  const [targetCustomer, setTargetCustomer] = useState(startup.targetCustomer)
  const [businessModel, setBusinessModel] = useState(startup.businessModel)
  const [whatBuilding, setWhatBuilding] = useState(startup.whatBuilding)
  const [needs, setNeeds] = useState<string[]>(startup.needs)

  // Traction
  const [revenue, setRevenue] = useState(startup.revenue)
  const [customers, setCustomers] = useState(startup.customers)
  const [users, setUsers] = useState(startup.users)
  const [growth, setGrowth] = useState(startup.growth)
  const [otherTraction, setOtherTraction] = useState(startup.otherTraction || startup.traction)

  // Search & discovery
  const [keywordTags, setKeywordTags] = useState<string[]>(
    startup.keywords ? startup.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
  )

  // Visibility
  const [visibility, setVisibility] = useState<StartupVisibility>(startup.visibility || 'Public')
  const [fundraisingVisible, setFundraisingVisible] = useState(startup.fundraisingVisible)
  const [isRaising, setIsRaising] = useState(startup.isRaising)

  const mutation = useMutation({
    mutationFn: () =>
      updateStartup(startup.id, {
        name,
        tagline,
        location,
        website,
        sector,
        stage,
        problem,
        solution,
        targetCustomer,
        businessModel,
        whatBuilding,
        revenue,
        customers,
        users,
        growth,
        otherTraction,
        keywords: keywordTags.join(', '),
        visibility,
        fundraisingVisible,
        isRaising,
        needs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success('Startup updated')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update startup'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit startup" size="lg">
      <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
        <SectionHeading title="Basic" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Location" hint="Optional" placeholder="e.g. Bengaluru, India" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input label="Website" hint="Optional" placeholder="yourstartup.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as StartupStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <SectionHeading title="Startup" hint="All optional — fill in what applies, leave the rest for later." />
        <Textarea label="Problem" value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
        <Textarea label="Solution" value={solution} onChange={(e) => setSolution(e.target.value)} rows={2} />
        <Textarea
          label="Target customer"
          hint="Optional"
          placeholder="Who are you building this for?"
          value={targetCustomer}
          onChange={(e) => setTargetCustomer(e.target.value)}
          rows={2}
        />
        <Textarea
          label="Business model"
          hint="Optional"
          placeholder="How do you make money?"
          value={businessModel}
          onChange={(e) => setBusinessModel(e.target.value)}
          rows={2}
        />
        <Textarea
          label="What we're building"
          hint="Optional"
          placeholder="What's the product, concretely?"
          value={whatBuilding}
          onChange={(e) => setWhatBuilding(e.target.value)}
          rows={2}
        />
        <div>
          <p className="text-sm font-medium text-fg mb-1.5">What are you looking for?</p>
          <TagInput value={needs} onChange={setNeeds} placeholder="e.g. Engineers, Funding, Mentors…" />
        </div>

        <SectionHeading title="Traction" hint="Whatever you can share — exact numbers, ranges, or a short note all work." />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Revenue" hint="Optional" placeholder="e.g. ₹10L MRR" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          <Input label="Customers" hint="Optional" placeholder="e.g. 450 paying customers" value={customers} onChange={(e) => setCustomers(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Users" hint="Optional" placeholder="e.g. 12,500 MAU" value={users} onChange={(e) => setUsers(e.target.value)} />
          <Input label="Growth" hint="Optional" placeholder="e.g. 20% MoM" value={growth} onChange={(e) => setGrowth(e.target.value)} />
        </div>
        <Textarea
          label="Other traction"
          hint="Optional"
          placeholder="Anything else worth sharing — press, partnerships, waitlist size…"
          value={otherTraction}
          onChange={(e) => setOtherTraction(e.target.value)}
          rows={2}
        />

        <SectionHeading title="Search & discovery" />
        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Keywords</p>
          <TagInput value={keywordTags} onChange={setKeywordTags} placeholder="Add a keyword and press Enter…" />
          <p className="text-xs text-fg-muted mt-1">Helps people find you when searching Nukkad — e.g. "fintech", "B2B", "climate".</p>
        </div>

        <SectionHeading title="Visibility" />
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2.5 text-sm text-fg cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'Public'}
              onChange={() => setVisibility('Public')}
              className="mt-0.5 size-4 accent-brand-600"
            />
            <span>
              <span className="font-medium">Public</span>
              <span className="block text-xs text-fg-muted">Anyone, including people without a Nukkad account, can view this startup.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-fg cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'Nukkad Members'}
              onChange={() => setVisibility('Nukkad Members')}
              className="mt-0.5 size-4 accent-brand-600"
            />
            <span>
              <span className="font-medium">Nukkad Members</span>
              <span className="block text-xs text-fg-muted">Only people signed in to Nukkad can view this startup.</span>
            </span>
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-fg cursor-pointer">
          <input
            type="checkbox"
            checked={isRaising}
            onChange={(e) => setIsRaising(e.target.checked)}
            className="size-4 rounded border-border accent-brand-600"
          />
          Currently raising
        </label>

        <label className="flex items-start gap-2.5 text-sm text-fg cursor-pointer">
          <input
            type="checkbox"
            checked={fundraisingVisible}
            onChange={(e) => setFundraisingVisible(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border accent-brand-600"
          />
          <span>
            <span className="font-medium">Show fundraising information</span>
            <span className="block text-xs text-fg-muted">
              When off, your raise status and fundraise details are hidden from everyone except your own team.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5 bg-surface sticky bottom-0">
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
