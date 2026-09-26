import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdminStartup, listAdminResourceChapters, uploadAdminStartupLogo } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { LogoPicker } from '@/components/startup/create/LogoPicker'
import type { LogoDraft } from '@/components/startup/create/create-startup-model'
import { PUBLISHER_IDENTITIES } from '@/lib/publisher-identities'
import { toast } from '@/store/toast.store'
import type { PublisherIdentityKey, StartupStage, StartupVisibility } from '@/types'

const STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']
const VISIBILITIES: StartupVisibility[] = ['Public', 'Nukkad Members']

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-wide text-fg-muted mt-1">{children}</p>
}

/**
 * Admin-only form to add a startup — every field a member can set when registering their own on
 * /startups/new (name, logo, tagline, location, website, sector, stage, problem, solution, target
 * customer, business model, what they're building, "looking for", traction, visibility and
 * fundraising visibility) is here too, plus the founder: enter a member's email and they become the
 * founder and can manage it; leave it empty and the admin account owns it (and can't be edited from
 * the member app). The startup is live for members as soon as it is added. Team invites are the one
 * thing intentionally left out — that's a bigger, separate flow (searching existing members and
 * assigning roles), not a fit for a quick-add admin form; founderEmail already covers "who owns it."
 * Mount it only while it is open so its fields start fresh each time.
 */
export function AdminStartupFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [logo, setLogo] = useState<LogoDraft | null>(null)
  const [sector, setSector] = useState('')
  const [tagline, setTagline] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [stage, setStage] = useState<StartupStage>('Early Traction')
  const [chapterId, setChapterId] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [businessModel, setBusinessModel] = useState('')
  const [whatBuilding, setWhatBuilding] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [revenue, setRevenue] = useState('')
  const [customers, setCustomers] = useState('')
  const [users, setUsers] = useState('')
  const [growth, setGrowth] = useState('')
  const [otherTraction, setOtherTraction] = useState('')
  const [visibility, setVisibility] = useState<StartupVisibility>('Public')
  const [fundraisingVisible, setFundraisingVisible] = useState(true)
  const [founderEmail, setFounderEmail] = useState('')
  const [publisherIdentity, setPublisherIdentity] = useState<PublisherIdentityKey>('BUILDADDA')

  // The admin token can't call the member chapters API, so the chapter picker uses the admin chapter list.
  const { data: chapters } = useQuery({ queryKey: ['admin', 'resource-chapters'], queryFn: listAdminResourceChapters })

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await createAdminStartup({
        name: name.trim(),
        sector: sector.trim(),
        tagline: tagline.trim(),
        location: location.trim(),
        website: website.trim(),
        stage,
        problem: problem.trim(),
        solution: solution.trim(),
        targetCustomer: targetCustomer.trim(),
        businessModel: businessModel.trim(),
        whatBuilding: whatBuilding.trim(),
        needs,
        revenue: revenue.trim(),
        customers: customers.trim(),
        users: users.trim(),
        growth: growth.trim(),
        otherTraction: otherTraction.trim(),
        visibility,
        fundraisingVisible,
        chapterId,
        founderEmail: founderEmail.trim(),
        publisherIdentity,
      })
      // Same shape as the member create-startup flow: the startup exists either way once this
      // resolves, so a logo failure here is reported softly rather than treated as the create failing.
      let logoFailed = false
      if (logo) {
        try {
          await uploadAdminStartupLogo(created.id, logo.file)
        } catch {
          logoFailed = true
        }
      }
      return { logoFailed }
    },
    onSuccess: ({ logoFailed }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'startups'] })
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      if (logoFailed) {
        toast.error('Startup added, but the logo could not be uploaded. You can try again once the founder edits the startup.')
      } else {
        toast.success(founderEmail.trim() ? 'Startup added — the founder has been notified' : 'Startup added — members can see it now')
      }
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this startup'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a startup"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Add startup
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <LogoPicker startupName={name} logo={logo} onChange={setLogo} />

        <SectionLabel>Basics</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Startup name" required value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
          <Input label="Sector" hint="Optional — e.g. Food delivery" value={sector} maxLength={100} onChange={(e) => setSector(e.target.value)} />
        </div>
        <Input label="Tagline" hint="Optional — one line on what they do" value={tagline} maxLength={300} onChange={(e) => setTagline(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Location" hint="Optional" value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} />
          <Input label="Website" hint="Optional" value={website} maxLength={500} onChange={(e) => setWebsite(e.target.value)} placeholder="yourstartup.com" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as StartupStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            <option value="">No chapter — platform-wide</option>
            {(chapters ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <SectionLabel>Startup</SectionLabel>
        <Textarea label="Problem" hint="Optional" value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} />
        <Textarea label="Solution" hint="Optional" value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} />

        <SectionLabel>Business</SectionLabel>
        <Textarea label="Target customer" hint="Optional" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} rows={2} />
        <Textarea label="Business model" hint="Optional" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} rows={2} />
        <Textarea label="What they're building" hint="Optional" value={whatBuilding} onChange={(e) => setWhatBuilding(e.target.value)} rows={2} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">What are they looking for?</p>
          <TagInput value={needs} onChange={setNeeds} placeholder="e.g. Engineers, Funding, Mentors…" maxLength={100} />
        </div>

        <SectionLabel>Traction</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Revenue" hint="Optional" value={revenue} maxLength={200} onChange={(e) => setRevenue(e.target.value)} />
          <Input label="Customers" hint="Optional" value={customers} maxLength={200} onChange={(e) => setCustomers(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Users" hint="Optional" value={users} maxLength={200} onChange={(e) => setUsers(e.target.value)} />
          <Input label="Growth" hint="Optional" value={growth} maxLength={200} onChange={(e) => setGrowth(e.target.value)} />
        </div>
        <Textarea label="Other traction" hint="Optional" value={otherTraction} onChange={(e) => setOtherTraction(e.target.value)} rows={2} />

        <SectionLabel>Visibility</SectionLabel>
        <Select
          label="Who can see this startup"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as StartupVisibility)}
        >
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {v === 'Public' ? 'Public — anyone can find and view it' : 'BuildAdda Members — only signed-in BuildAdda members'}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2.5 text-sm text-fg cursor-pointer select-none">
          <Checkbox checked={fundraisingVisible} onChange={(e) => setFundraisingVisible(e.target.checked)} />
          Show fundraising details to whoever can see the startup, once it's raising
        </label>

        <SectionLabel>Founder</SectionLabel>
        <Input
          label="Founder's email"
          hint="Optional. A member with this email becomes the founder and can edit the startup. Leave empty to add it under the admin account, which can't be edited from the member app."
          type="email"
          value={founderEmail}
          maxLength={255}
          onChange={(e) => setFounderEmail(e.target.value)}
        />

        {!founderEmail.trim() && (
          <Select
            label="Publisher identity"
            hint={'Shown as "Curated by" on the profile — not a separate user, still your admin account behind it'}
            value={publisherIdentity}
            onChange={(e) => setPublisherIdentity(e.target.value as PublisherIdentityKey)}
          >
            {PUBLISHER_IDENTITIES.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </Select>
        )}
      </div>
    </Modal>
  )
}
