import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { listStartupSectors } from '@/services/startups.service'
import { ChoiceCards } from '@/components/startup/ChoiceCards'
import { LIMITS, hintWithCount, type FieldErrors } from '@/components/startup/create/create-startup-model'
import { LogoField } from '@/components/startup/manage/LogoField'
import { SectionForm } from '@/components/startup/manage/SectionForm'
import { checkFields } from '@/components/startup/manage/manage-model'
import { useSectionForm } from '@/components/startup/manage/useSectionForm'
import { STARTUP_STAGES } from '@/lib/startup-meta'
import { cn } from '@/lib/utils'
import type { Startup, StartupStage, UpdateStartupInput } from '@/types'

const STAGE_HELP: Record<StartupStage, string> = {
  Idea: 'Still validating the concept.',
  MVP: 'A first version exists.',
  'Early Traction': 'First users or revenue.',
  Growth: 'Growing a repeatable model.',
  Scaling: 'Expanding to new markets.',
}

interface BasicsDraft {
  name: string
  tagline: string
  location: string
  website: string
  sector: string
  stage: StartupStage
  keywords: string[]
}

function toDraft(startup: Startup): BasicsDraft {
  return {
    name: startup.name,
    tagline: startup.tagline,
    location: startup.location,
    website: startup.website,
    sector: startup.sector,
    stage: startup.stage,
    keywords: startup.keywords ? startup.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
  }
}

function toInput(draft: BasicsDraft): UpdateStartupInput {
  return {
    name: draft.name.trim(),
    tagline: draft.tagline.trim(),
    location: draft.location.trim(),
    website: draft.website.trim(),
    sector: draft.sector.trim(),
    stage: draft.stage,
    keywords: draft.keywords.join(', '),
  }
}

function validate(draft: BasicsDraft): FieldErrors {
  return checkFields(['name', 'tagline', 'location', 'website', 'sector', 'stage'], draft)
}

/** Name, logo, tagline, location, website, sector, stage and the keywords people find the startup by. */
export function BasicInfoSection({ startup, onDirtyChange }: { startup: Startup; onDirtyChange: (dirty: boolean) => void }) {
  const form = useSectionForm({ startup, toDraft, toInput, validate, onDirtyChange, successMessage: 'Basic information saved' })
  const { draft, errors, change, touch } = form

  // The sectors real startups already use, so this one is spelled the same way Discovery filters by it.
  const sectors = useQuery({ queryKey: ['startups', 'sectors'], queryFn: listStartupSectors, staleTime: 60_000 })
  const suggestions = (sectors.data ?? []).slice(0, 8)

  return (
    <SectionForm title="Basic information" description="How your startup appears across BuildAdda." form={form}>
      <LogoField startup={startup} />

      <Input
        id="msf-name"
        label="Startup name"
        required
        value={draft.name}
        onChange={(e) => change({ name: e.target.value })}
        onBlur={() => touch('name')}
        autoComplete="off"
        aria-invalid={!!errors.name}
        error={errors.name}
        hint={hintWithCount(undefined, draft.name, LIMITS.name)}
      />
      <Input
        id="msf-tagline"
        label="Tagline"
        value={draft.tagline}
        onChange={(e) => change({ tagline: e.target.value })}
        onBlur={() => touch('tagline')}
        placeholder="One line on what you do"
        autoComplete="off"
        aria-invalid={!!errors.tagline}
        error={errors.tagline}
        hint={hintWithCount('Shown under your name across BuildAdda.', draft.tagline, LIMITS.tagline)}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="msf-location"
          label="Location"
          value={draft.location}
          onChange={(e) => change({ location: e.target.value })}
          onBlur={() => touch('location')}
          placeholder="e.g. Bengaluru, India"
          autoComplete="off"
          aria-invalid={!!errors.location}
          error={errors.location}
          hint={hintWithCount(undefined, draft.location, LIMITS.location)}
        />
        <Input
          id="msf-website"
          label="Website"
          inputMode="url"
          value={draft.website}
          onChange={(e) => change({ website: e.target.value })}
          onBlur={() => touch('website')}
          placeholder="yourstartup.com"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={!!errors.website}
          error={errors.website}
          hint="With or without https://"
        />
      </div>

      <div>
        <Input
          id="msf-sector"
          label="Sector"
          list="msf-sector-options"
          value={draft.sector}
          onChange={(e) => change({ sector: e.target.value })}
          onBlur={() => touch('sector')}
          placeholder="e.g. Fintech, Health, Climate"
          autoComplete="off"
          aria-invalid={!!errors.sector}
          error={errors.sector}
          hint={hintWithCount('Pick one below or type your own; people find startups by sector.', draft.sector, LIMITS.sector)}
        />
        <datalist id="msf-sector-options">
          {suggestions.map((s) => (
            <option key={s.sector} value={s.sector} />
          ))}
        </datalist>
        {suggestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Sectors already on BuildAdda">
            {suggestions.map((s) => {
              const active = draft.sector.trim().toLowerCase() === s.sector.toLowerCase()
              return (
                <button
                  key={s.sector}
                  type="button"
                  aria-pressed={active}
                  onClick={() => change({ sector: s.sector })}
                  className={cn(
                    'max-w-full cursor-pointer truncate rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    active ? 'border-brand-500/30 bg-brand-500/10 text-fg-brand' : 'border-border/80 bg-surface text-fg-secondary hover:border-border-strong hover:text-fg',
                  )}
                >
                  {s.sector}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Stage</p>
        <ChoiceCards
          id="msf-stage"
          label="Stage"
          columns="three"
          value={draft.stage}
          onChange={(stage) => change({ stage })}
          options={STARTUP_STAGES.map((stage) => ({ value: stage, label: stage, description: STAGE_HELP[stage] }))}
        />
        {errors.stage && <p className="mt-1.5 text-xs font-medium text-danger-500">{errors.stage}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Keywords</p>
        <TagInput value={draft.keywords} onChange={(keywords) => change({ keywords })} placeholder="Add a keyword and press Enter…" />
        <p className="mt-1 text-xs text-fg-muted">Helps people find you when searching BuildAdda, e.g. “fintech”, “B2B”, “climate”.</p>
      </div>
    </SectionForm>
  )
}
