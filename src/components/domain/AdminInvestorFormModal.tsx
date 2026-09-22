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
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { toast } from '@/store/toast.store'
import type { InvestorType } from '@/types'

const INVESTOR_TYPES: InvestorType[] = ['Angel', 'VC', 'Family Office', 'Corporate VC', 'Accelerator', 'Other']
const ACCEPTED_IMAGES = '.png,.jpg,.jpeg,.webp,.gif'

/**
 * Admin-only form to add or edit an Investor Discovery catalog record. This is the ONLY way one of these is
 * created — see AdminInvestorCatalogPage. Mount it only while open so its fields start fresh each time.
 */
export function AdminInvestorFormModal({ onClose, investor }: { onClose: () => void; investor?: AdminInvestorRow }) {
  const editing = !!investor
  const queryClient = useQueryClient()
  const [name, setName] = useState(investor?.name ?? '')
  const [investorType, setInvestorType] = useState<InvestorType>(investor?.investorType ?? 'VC')
  const [description, setDescription] = useState(investor?.description ?? '')
  const [location, setLocation] = useState(investor?.location ?? '')
  const [website, setWebsite] = useState(investor?.website ?? '')
  const [sectors, setSectors] = useState<string[]>(investor?.sectors ?? [])
  const [stages, setStages] = useState<string[]>(investor?.stages ?? [])
  const [chequeMin, setChequeMin] = useState(investor?.chequeMin != null ? String(investor.chequeMin) : '')
  const [chequeMax, setChequeMax] = useState(investor?.chequeMax != null ? String(investor.chequeMax) : '')
  const [active, setActive] = useState(investor?.active ?? true)
  const [visible, setVisible] = useState(investor?.visible ?? true)
  const [linkedInvestorProfileId, setLinkedInvestorProfileId] = useState(investor?.linkedInvestorProfileId ?? '')
  const [logo, setLogo] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const min = chequeMin.trim() === '' ? undefined : Number(chequeMin)
  const max = chequeMax.trim() === '' ? undefined : Number(chequeMax)
  const rangeValid = min === undefined || max === undefined || min <= max

  const mutation = useMutation({
    mutationFn: async () => {
      if (!investor) {
        return createAdminInvestor({
          name,
          investorType,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          website: website.trim() || undefined,
          sectors,
          stages,
          chequeMin: min,
          chequeMax: max,
          active,
          visible,
          linkedInvestorProfileId: linkedInvestorProfileId.trim() || undefined,
          logo: logo ?? undefined,
        })
      }
      const updated = await updateAdminInvestor(investor.id, {
        name,
        investorType,
        description: description.trim(),
        location: location.trim(),
        website: website.trim(),
        sectors,
        stages,
        chequeMin: min,
        chequeMax: max,
        active,
        visible,
        linkedInvestorProfileId: linkedInvestorProfileId.trim(),
      })
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
          <Input label="Location" hint="Optional" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore, India" />
          <Input label="Website" hint="Optional" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
        </div>

        <Textarea label="Description / investment thesis" hint="Optional" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Sectors</p>
          <TagInput value={sectors} onChange={setSectors} placeholder="Add a sector and press Enter…" maxLength={100} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg">Preferred stages</p>
          <TagInput value={stages} onChange={setStages} placeholder="Add a stage and press Enter…" maxLength={100} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Minimum cheque (₹)"
            hint="Optional"
            type="number"
            min={0}
            value={chequeMin}
            onChange={(e) => setChequeMin(e.target.value)}
          />
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
          <p className="mt-1.5 text-xs text-fg-muted">Optional PNG, JPEG, WEBP or GIF. Without one, cards show the investor's initials.</p>
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
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer rounded-md border-border accent-[var(--color-brand-600)]"
            />
            <span>
              <span className="font-medium">Active</span>
              <span className="block text-xs text-fg-muted">Inactive investors never appear in Discovery.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer rounded-md border-border accent-[var(--color-brand-600)]"
            />
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
