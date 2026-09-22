import { Info } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import type { StepProps } from '@/components/startup/create/StepBasics'
import { LIMITS, hintWithCount, type FieldKey } from '@/components/startup/create/create-startup-model'

const FIGURES: { key: Extract<FieldKey, 'revenue' | 'customers' | 'users' | 'growth'>; label: string; placeholder: string }[] = [
  { key: 'revenue', label: 'Revenue', placeholder: 'e.g. ₹2L per month' },
  { key: 'customers', label: 'Customers', placeholder: 'e.g. 40 paying customers' },
  { key: 'users', label: 'Users', placeholder: 'e.g. 1,200 monthly users' },
  { key: 'growth', label: 'Growth', placeholder: 'e.g. 15% month over month' },
]

/** Step 4: the progress the founders report. Everything is optional and stored exactly as typed. */
export function StepTraction({ draft, errors, onChange, onBlurField }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-500/5 p-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-fg-brand" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-fg-secondary">
          These are figures <strong className="font-semibold text-fg">you provide</strong>. BuildAdda shows them as you wrote them and doesn’t verify them. Leave a
          field empty if it doesn’t apply. Write 0 if that is the honest number.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FIGURES.map((figure) => (
          <Input
            key={figure.key}
            id={`csf-${figure.key}`}
            label={figure.label}
            value={draft[figure.key]}
            onChange={(e) => onChange({ [figure.key]: e.target.value })}
            onBlur={() => onBlurField(figure.key)}
            placeholder={figure.placeholder}
            autoComplete="off"
            aria-invalid={!!errors[figure.key]}
            error={errors[figure.key]}
            hint={hintWithCount('Optional', draft[figure.key], LIMITS[figure.key])}
          />
        ))}
      </div>

      <Textarea
        id="csf-otherTraction"
        label="Other traction"
        rows={4}
        value={draft.otherTraction}
        onChange={(e) => onChange({ otherTraction: e.target.value })}
        onBlur={() => onBlurField('otherTraction')}
        placeholder="Pilots, partnerships, waitlist, awards, press…"
        aria-invalid={!!errors.otherTraction}
        error={errors.otherTraction}
        hint={hintWithCount('Optional. Anything else that shows progress.', draft.otherTraction, LIMITS.otherTraction)}
      />
    </div>
  )
}
