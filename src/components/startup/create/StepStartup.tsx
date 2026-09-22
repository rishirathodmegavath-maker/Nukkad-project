import { useQuery } from '@tanstack/react-query'
import { Input, Textarea } from '@/components/ui/Input'
import { listStartupSectors } from '@/services/startups.service'
import { ChoiceCards } from '@/components/startup/ChoiceCards'
import type { StepProps } from '@/components/startup/create/StepBasics'
import { LIMITS, hintWithCount } from '@/components/startup/create/create-startup-model'
import { STARTUP_STAGES } from '@/lib/startup-meta'
import { cn } from '@/lib/utils'
import type { StartupStage } from '@/types'

const STAGE_HELP: Record<StartupStage, string> = {
  Idea: 'Still validating the concept.',
  MVP: 'A first version exists.',
  'Early Traction': 'First users or revenue.',
  Growth: 'Growing a repeatable model.',
  Scaling: 'Expanding to new markets.',
}

/** Step 2: what the startup is and the problem and solution behind it. */
export function StepStartup({ draft, errors, onChange, onBlurField }: StepProps) {
  // The sectors real startups already use, so a new one can be spelled the same way Discovery filters by it.
  const sectors = useQuery({ queryKey: ['startups', 'sectors'], queryFn: listStartupSectors, staleTime: 60_000 })
  const suggestions = (sectors.data ?? []).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Input
          id="csf-sector"
          label="Sector"
          list="csf-sector-options"
          value={draft.sector}
          onChange={(e) => onChange({ sector: e.target.value })}
          onBlur={() => onBlurField('sector')}
          placeholder="e.g. Fintech, Health, Climate"
          autoComplete="off"
          aria-invalid={!!errors.sector}
          error={errors.sector}
          hint={hintWithCount('Optional. Pick one below or type your own; people find startups by sector.', draft.sector, LIMITS.sector)}
        />
        <datalist id="csf-sector-options">
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
                  onClick={() => onChange({ sector: s.sector })}
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
          id="csf-stage"
          label="Stage"
          columns="three"
          value={draft.stage}
          onChange={(stage) => onChange({ stage })}
          options={STARTUP_STAGES.map((stage) => ({ value: stage, label: stage, description: STAGE_HELP[stage] }))}
        />
        {errors.stage && <p className="mt-1.5 text-xs font-medium text-danger-500">{errors.stage}</p>}
      </div>

      <Textarea
        id="csf-problem"
        label="Problem"
        rows={5}
        value={draft.problem}
        onChange={(e) => onChange({ problem: e.target.value })}
        onBlur={() => onBlurField('problem')}
        placeholder="Who has this problem, and why does it matter?"
        aria-invalid={!!errors.problem}
        error={errors.problem}
        hint={hintWithCount('Optional. A few sentences is plenty.', draft.problem, LIMITS.problem)}
      />
      <Textarea
        id="csf-solution"
        label="Solution"
        rows={5}
        value={draft.solution}
        onChange={(e) => onChange({ solution: e.target.value })}
        onBlur={() => onBlurField('solution')}
        placeholder="How does your startup solve it?"
        aria-invalid={!!errors.solution}
        error={errors.solution}
        hint={hintWithCount('Optional. What you do differently, in plain words.', draft.solution, LIMITS.solution)}
      />
    </div>
  )
}
