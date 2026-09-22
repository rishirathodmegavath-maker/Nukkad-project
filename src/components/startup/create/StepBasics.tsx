import { useQuery } from '@tanstack/react-query'
import { Input, Select } from '@/components/ui/Input'
import { listChapters } from '@/services/chapters.service'
import { LogoPicker } from '@/components/startup/create/LogoPicker'
import { LIMITS, hintWithCount, type CreateStartupDraft, type FieldErrors, type FieldKey } from '@/components/startup/create/create-startup-model'

export interface StepProps {
  draft: CreateStartupDraft
  /** Only the errors that should be showing right now. */
  errors: FieldErrors
  onChange: (patch: Partial<CreateStartupDraft>) => void
  onBlurField: (key: FieldKey) => void
}

/** Step 1: who the startup is. Only the name is required. */
export function StepBasics({ draft, errors, onChange, onBlurField, defaultChapterId }: StepProps & { defaultChapterId: string }) {
  const { data: chapters } = useQuery({ queryKey: ['chapters', 'all'], queryFn: () => listChapters() })

  return (
    <div className="flex flex-col gap-5">
      <LogoPicker startupName={draft.name} logo={draft.logo} onChange={(logo) => onChange({ logo })} />

      <Input
        id="csf-name"
        label="Startup name"
        required
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        onBlur={() => onBlurField('name')}
        placeholder="e.g. Swiggy"
        autoComplete="off"
        aria-invalid={!!errors.name}
        error={errors.name}
        hint={hintWithCount(undefined, draft.name, LIMITS.name)}
      />
      <Input
        id="csf-tagline"
        label="Tagline"
        value={draft.tagline}
        onChange={(e) => onChange({ tagline: e.target.value })}
        onBlur={() => onBlurField('tagline')}
        placeholder="One line on what you do"
        autoComplete="off"
        aria-invalid={!!errors.tagline}
        error={errors.tagline}
        hint={hintWithCount('Optional. Shown under your name across BuildAdda.', draft.tagline, LIMITS.tagline)}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="csf-location"
          label="Location"
          value={draft.location}
          onChange={(e) => onChange({ location: e.target.value })}
          onBlur={() => onBlurField('location')}
          placeholder="e.g. Bengaluru, India"
          autoComplete="off"
          aria-invalid={!!errors.location}
          error={errors.location}
          hint={hintWithCount('Optional', draft.location, LIMITS.location)}
        />
        <Input
          id="csf-website"
          label="Website"
          inputMode="url"
          value={draft.website}
          onChange={(e) => onChange({ website: e.target.value })}
          onBlur={() => onBlurField('website')}
          placeholder="yourstartup.com"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={!!errors.website}
          error={errors.website}
          hint="Optional. With or without https://"
        />
      </div>
      <Select
        id="csf-chapter"
        label="Chapter"
        hint="Optional. Link your startup to a BuildAdda chapter."
        value={draft.chapterId ?? defaultChapterId}
        onChange={(e) => onChange({ chapterId: e.target.value })}
      >
        <option value="">No chapter (platform-wide)</option>
        {(chapters ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
