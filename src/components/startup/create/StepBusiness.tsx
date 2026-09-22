import { Textarea } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import type { StepProps } from '@/components/startup/create/StepBasics'
import { LIMITS, hintWithCount } from '@/components/startup/create/create-startup-model'

/** Step 3: who it is for, how it earns, what is being built, and what help the startup is looking for. */
export function StepBusiness({ draft, errors, onChange, onBlurField }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Textarea
        id="csf-targetCustomer"
        label="Target customer"
        rows={3}
        value={draft.targetCustomer}
        onChange={(e) => onChange({ targetCustomer: e.target.value })}
        onBlur={() => onBlurField('targetCustomer')}
        placeholder="e.g. Solo hardware founders in India"
        aria-invalid={!!errors.targetCustomer}
        error={errors.targetCustomer}
        hint={hintWithCount('Optional. Who is this built for?', draft.targetCustomer, LIMITS.targetCustomer)}
      />
      <Textarea
        id="csf-businessModel"
        label="Business model"
        rows={3}
        value={draft.businessModel}
        onChange={(e) => onChange({ businessModel: e.target.value })}
        onBlur={() => onBlurField('businessModel')}
        placeholder="e.g. 2% take rate on every order"
        aria-invalid={!!errors.businessModel}
        error={errors.businessModel}
        hint={hintWithCount('Optional. How does it make money?', draft.businessModel, LIMITS.businessModel)}
      />
      <Textarea
        id="csf-whatBuilding"
        label="What you’re building"
        rows={4}
        value={draft.whatBuilding}
        onChange={(e) => onChange({ whatBuilding: e.target.value })}
        onBlur={() => onBlurField('whatBuilding')}
        placeholder="Describe the product or service in a few lines."
        aria-invalid={!!errors.whatBuilding}
        error={errors.whatBuilding}
        hint={hintWithCount('Optional. This is the “About” section of your profile.', draft.whatBuilding, LIMITS.whatBuilding)}
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Looking for</p>
        <TagInput value={draft.needs} onChange={(needs) => onChange({ needs })} placeholder="e.g. Engineers, Funding, Mentors…" maxLength={LIMITS.need} />
        <p className="mt-1.5 text-xs text-fg-muted">Optional. Type one and press Enter. These show on your profile and help the right people find you.</p>
      </div>
    </div>
  )
}
