import { useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAdminInvestor,
  removeAdminInvestorLogo,
  replaceAdminInvestorLogo,
  updateAdminInvestor,
  type AdminInvestorRow,
} from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { toast } from '@/store/toast.store'
import type { InvestorType } from '@/types'

const INVESTOR_TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']
const ACCEPTED_IMAGES = '.png,.jpg,.jpeg,.webp,.gif'

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-wide text-fg-muted mt-1">{children}</p>
}

/**
 * Admin-only form to add or edit an Investor Discovery catalog record by hand. See AdminInvestorCatalogPage's
 * Import tab for the primary, bulk way this catalog gets populated (CSV) — this modal is the secondary,
 * one-at-a-time path, and also how CSV-sourced fields get manually enriched afterward.
 */
export function AdminInvestorFormModal({ onClose, investor }: { onClose: () => void; investor?: AdminInvestorRow }) {
  const editing = !!investor
  const queryClient = useQueryClient()
  const [name, setName] = useState(investor?.name ?? '')
  const [investorType, setInvestorType] = useState<InvestorType>(investor?.investorType ?? 'VC')
  const [description, setDescription] = useState(investor?.description ?? '')
  const [location, setLocation] = useState(investor?.location ?? '')
  const [country, setCountry] = useState(investor?.country ?? '')
  const [website, setWebsite] = useState(investor?.website ?? '')
  const [domain, setDomain] = useState(investor?.domain ?? '')
  const [sectors, setSectors] = useState<string[]>(investor?.sectors ?? [])
  const [stages, setStages] = useState<string[]>(investor?.stages ?? [])
  const [programs, setPrograms] = useState<string[]>(investor?.programs ?? [])
  const [keyPeople, setKeyPeople] = useState<string[]>(investor?.keyPeople ?? [])
  const [investmentCount, setInvestmentCount] = useState(investor?.investmentCount != null ? String(investor.investmentCount) : '')
  const [exitCount, setExitCount] = useState(investor?.exitCount != null ? String(investor.exitCount) : '')
  const [chequeMin, setChequeMin] = useState(investor?.chequeMin != null ? String(investor.chequeMin) : '')
  const [chequeMax, setChequeMax] = useState(investor?.chequeMax != null ? String(investor.chequeMax) : '')
  const [active, setActive] = useState(investor?.active ?? true)
  const [visible, setVisible] = useState(investor?.visible ?? true)
  const [facebookUrl, setFacebookUrl] = useState(investor?.facebookUrl ?? '')
  const [instagramUrl, setInstagramUrl] = useState(investor?.instagramUrl ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(investor?.linkedinUrl ?? '')
  const [twitterUrl, setTwitterUrl] = useState(investor?.twitterUrl ?? '')
  const [contactEmail, setContactEmail] = useState(investor?.contactEmail ?? '')
  const [contactEmailVerified, setContactEmailVerified] = useState(investor?.contactEmailVerified ?? false)
  const [secondaryEmail, setSecondaryEmail] = useState(investor?.secondaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = useState(investor?.phoneNumber ?? '')
  const [linkedInvestorProfileId, setLinkedInvestorProfileId] = useState(investor?.linkedInvestorProfileId ?? '')
  const [logo, setLogo] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const min = chequeMin.trim() === '' ? undefined : Number(chequeMin)
  const max = chequeMax.trim() === '' ? undefined : Number(chequeMax)
  const rangeValid = min === undefined || max === undefined || min <= max

  const mutation = useMutation({
    mutationFn: async () => {
      const common = {
        name,
        investorType,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        country: country.trim() || undefined,
        website: website.trim() || undefined,
        domain: domain.trim() || undefined,
        sectors,
        stages,
        programs,
        keyPeople,
        investmentCount: investmentCount.trim() === '' ? undefined : Number(investmentCount),
        exitCount: exitCount.trim() === '' ? undefined : Number(exitCount),
        chequeMin: min,
        chequeMax: max,
        active,
        visible,
        facebookUrl: facebookUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactEmailVerified,
        secondaryEmail: secondaryEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      }
      if (!investor) {
        return createAdminInvestor({ ...common, linkedInvestorProfileId: linkedInvestorProfileId.trim() || undefined, logo: logo ?? undefined })
      }
      const updated = await updateAdminInvestor(investor.id, { ...common, linkedInvestorProfileId: linkedInvestorProfileId.trim() })
      if (logo) return replaceAdminInvestorLogo(investor.id, logo)
      if (removeLogo && investor.logoUrl) return removeAdminInvestorLogo(investor.id)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'investor-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['investor-catalog'] })
      if (investor) queryClient.invalidateQueries({ queryKey: ['investor-catalog', investor.id] })
      toast.success(editing ? 'Investor updated' : 'Investor added — founders with a startup can now discover it')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this investor'),
  })

  const canSubmit = !!name.trim() && rangeValid
  const showingCurrentLogo = editing && !!investor.logoUrl && !removeLogo && !logo

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit investor' : 'Add an investor'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            {editing ? 'Save changes' : 'Add investor'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Investor / firm name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Investor type" value={investorType} onChange={(e) => setInvestorType(e.target.value as InvestorType)}>
            {INVESTOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input label="Location" hint="Optional" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore" />
          <Input label="Country" hint="Optional" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" />
          <Input label="Website" hint="Optional" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          <Input label="Domain" hint="Optional — powers a logo fallback when there's no uploaded one" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. peak.vc" />
        </div>

        <Textarea label="Description / investment thesis" hint="Optional" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Sectors / industries</p>
          <TagInput value={sectors} onChange={setSectors} placeholder="Add a sector and press Enter…" maxLength={100} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Preferred stages</p>
          <TagInput value={stages} onChange={setStages} placeholder="Add a stage and press Enter…" maxLength={100} />
        </div>

        <SectionLabel>Track record</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Number of investments" hint="Optional" type="number" min={0} value={investmentCount} onChange={(e) => setInvestmentCount(e.target.value)} />
          <Input label="Number of exits" hint="Optional" type="number" min={0} value={exitCount} onChange={(e) => setExitCount(e.target.value)} />
          <Input label="Minimum cheque (₹)" hint="Optional" type="number" min={0} value={chequeMin} onChange={(e) => setChequeMin(e.target.value)} />
          <Input
            label="Maximum cheque (₹)"
            hint="Optional"
            type="number"
            min={0}
            value={chequeMax}
            error={rangeValid ? undefined : 'Minimum cannot be greater than maximum'}
            onChange={(e) => setChequeMax(e.target.value)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Programs</p>
          <TagInput value={programs} onChange={setPrograms} placeholder="e.g. an accelerator cohort — press Enter…" maxLength={100} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Key people</p>
          <TagInput value={keyPeople} onChange={setKeyPeople} placeholder="Add a name and press Enter…" maxLength={100} />
        </div>

        <SectionLabel>Social links</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="LinkedIn" hint="Optional" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/…" />
          <Input label="Twitter / X" hint="Optional" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/…" />
          <Input label="Facebook" hint="Optional" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/…" />
          <Input label="Instagram" hint="Optional" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" />
        </div>

        <SectionLabel>Private contact details — never shown to founders</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Contact email" hint="Optional" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <Input label="Secondary email" hint="Optional" type="email" value={secondaryEmail} onChange={(e) => setSecondaryEmail(e.target.value)} />
          <Input label="Phone number" hint="Optional" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5 text-sm text-fg">
            <Checkbox checked={contactEmailVerified} onChange={(e) => setContactEmailVerified(e.target.checked)} />
            Contact email verified
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Logo</p>
          {showingCurrentLogo && (
            <div className="mb-2 flex items-center gap-3">
              <img src={investor.logoUrl!} alt="" className="h-12 w-12 rounded-lg border border-border/80 object-cover" />
              <Button type="button" size="sm" variant="ghost" onClick={() => setRemoveLogo(true)}>
                Remove logo
              </Button>
            </div>
          )}
          <input
            type="file"
            accept={ACCEPTED_IMAGES}
            aria-label="Logo"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLogo(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-fg-secondary file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border/80 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg hover:file:bg-surface-hover"
          />
          <p className="mt-1.5 text-xs text-fg-muted">Optional PNG, JPEG, WEBP or GIF. Without one, cards try the domain's logo, then fall back to initials.</p>
        </div>

        <Input
          label="Linked investor account ID"
          hint="Optional — advanced"
          value={linkedInvestorProfileId}
          onChange={(e) => setLinkedInvestorProfileId(e.target.value)}
          placeholder="Paste an activated investor profile's ID"
        />
        {investor?.linkedInvestorProfileName && (
          <p className="-mt-2.5 text-xs text-fg-muted">Currently linked to: {investor.linkedInvestorProfileName}</p>
        )}
        <p className="-mt-2.5 text-xs text-fg-muted">
          If this investor is also a real, activated BuildAdda account (Investor Applications), link it here so
          introduction requests go straight to their inbox and open a conversation once accepted. Leave blank for
          most investors — their request is simply recorded for you to follow up on.
        </p>

        <div className="flex flex-col gap-2 rounded-lg border border-border/80 p-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg">
            <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium">Active</span>
              <span className="block text-xs text-fg-muted">Inactive investors never appear in Discovery.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg">
            <Checkbox checked={visible} onChange={(e) => setVisible(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium">Visible</span>
              <span className="block text-xs text-fg-muted">Hide without deactivating — e.g. while you finish editing details.</span>
            </span>
          </label>
        </div>
      </div>
    </Modal>
  )
}
