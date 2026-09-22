import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdminGrant } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { toast } from '@/store/toast.store'
import type { GrantProviderType } from '@/types'

const PROVIDER_TYPES: GrantProviderType[] = ['Government', 'Accelerator', 'Corporate', 'Foundation', 'Other']
const STAGES = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

/**
 * Admin-only form to publish a grant listing, mirroring the member GrantFormPage.tsx fields.
 * createdByEmail: enter a member's email and they become the listing's creator (and are told); leave
 * it empty and the admin account owns it. Unlike a member's own submission this is live at once, not
 * sent through the pending-review queue. Mount it only while it is open so its fields start fresh
 * each time.
 */
export function AdminGrantFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [providerType, setProviderType] = useState<GrantProviderType>('Government')
  const [description, setDescription] = useState('')
  const [fundingAmount, setFundingAmount] = useState('')
  const [eligibilityCriteria, setEligibilityCriteria] = useState('')
  const [eligibleSectors, setEligibleSectors] = useState<string[]>([])
  const [eligibleStages, setEligibleStages] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [applicationUrl, setApplicationUrl] = useState('')
  const [createdByEmail, setCreatedByEmail] = useState('')

  function toggleStage(stage: string) {
    setEligibleStages((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createAdminGrant({
        name: name.trim(),
        provider: provider.trim(),
        providerType,
        description: description.trim(),
        fundingAmount: fundingAmount.trim(),
        eligibilityCriteria: eligibilityCriteria.trim(),
        eligibleSectors,
        eligibleStages,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        applicationUrl: applicationUrl.trim(),
        createdByEmail: createdByEmail.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'grants'] })
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      toast.success(createdByEmail.trim() ? 'Grant added — the creator has been notified' : 'Grant added — members can see it now')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this grant'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a grant"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !provider.trim() || !applicationUrl.trim()} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Add grant
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Grant / scheme name" required value={name} maxLength={200} onChange={(e) => setName(e.target.value)} placeholder="e.g. Startup India Seed Fund" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Provider" required value={provider} maxLength={200} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Govt of India" />
          <Select label="Provider type" value={providerType} onChange={(e) => setProviderType(e.target.value as GrantProviderType)}>
            {PROVIDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <Textarea label="Description" hint="Optional" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this grant for?" rows={3} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Funding amount" hint="Optional" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} placeholder="e.g. Up to ₹50L, equity-free" />
          <Input label="Application deadline" hint="Optional — leave blank if rolling" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <Textarea
          label="Eligibility criteria"
          hint="Optional"
          value={eligibilityCriteria}
          onChange={(e) => setEligibilityCriteria(e.target.value)}
          placeholder="Who can apply?"
          rows={3}
        />

        <div>
          <p className="mb-1 text-sm font-medium text-fg-secondary">Eligible stages</p>
          <p className="mb-2 text-xs text-fg-muted">Leave all unselected to make this open to every stage.</p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => {
              const active = eligibleStages.includes(stage)
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className={
                    active
                      ? 'rounded-full px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white cursor-pointer'
                      : 'rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-sunken text-fg-secondary hover:bg-surface-hover cursor-pointer'
                  }
                >
                  {stage}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-fg-secondary">Eligible sectors</p>
          <p className="mb-2 text-xs text-fg-muted">Leave empty to make this open to every sector.</p>
          <TagInput value={eligibleSectors} onChange={setEligibleSectors} placeholder="Add a sector and press Enter…" maxLength={100} />
        </div>

        <Input
          label="Application URL"
          required
          value={applicationUrl}
          onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="The provider's own application page"
        />

        <Input
          label="Created by (member's email)"
          hint="Optional. That member becomes the listing's creator and is told. Leave empty to add it under the admin account."
          type="email"
          value={createdByEmail}
          maxLength={255}
          onChange={(e) => setCreatedByEmail(e.target.value)}
        />
      </div>
    </Modal>
  )
}
