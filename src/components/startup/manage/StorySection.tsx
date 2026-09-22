import { Textarea } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { LIMITS, hintWithCount, type FieldErrors } from '@/components/startup/create/create-startup-model'
import { SectionForm } from '@/components/startup/manage/SectionForm'
import { checkFields } from '@/components/startup/manage/manage-model'
import { useSectionForm } from '@/components/startup/manage/useSectionForm'
import type { Startup, UpdateStartupInput } from '@/types'

interface StoryDraft {
  problem: string
  solution: string
  targetCustomer: string
  whatBuilding: string
  businessModel: string
  needs: string[]
}

function toDraft(startup: Startup): StoryDraft {
  return {
    problem: startup.problem,
    solution: startup.solution,
    targetCustomer: startup.targetCustomer,
    whatBuilding: startup.whatBuilding,
    businessModel: startup.businessModel,
    needs: startup.needs,
  }
}

function toInput(draft: StoryDraft): UpdateStartupInput {
  return {
    problem: draft.problem.trim(),
    solution: draft.solution.trim(),
    targetCustomer: draft.targetCustomer.trim(),
    whatBuilding: draft.whatBuilding.trim(),
    businessModel: draft.businessModel.trim(),
    // The server keeps these as a set, so their order carries no meaning; sorting keeps "changed?" honest.
    needs: [...draft.needs].sort((a, b) => a.localeCompare(b)),
  }
}

function validate(draft: StoryDraft): FieldErrors {
  return checkFields(['problem', 'solution', 'targetCustomer', 'whatBuilding', 'businessModel'], draft)
}

/** The story behind the startup: the problem, the solution, who it is for, how it earns, and what help it is looking for. */
export function StorySection({ startup, onDirtyChange }: { startup: Startup; onDirtyChange: (dirty: boolean) => void }) {
  const form = useSectionForm({ startup, toDraft, toInput, validate, onDirtyChange, successMessage: 'Problem and solution saved' })
  const { draft, errors, change, touch } = form

  return (
    <SectionForm title="Problem & solution" description="Tell people what you’re building and why. Everything here is optional." form={form}>
      <Textarea
        id="msf-problem"
        label="Problem"
        rows={5}
        value={draft.problem}
        onChange={(e) => change({ problem: e.target.value })}
        onBlur={() => touch('problem')}
        placeholder="Who has this problem, and why does it matter?"
        aria-invalid={!!errors.problem}
        error={errors.problem}
        hint={hintWithCount('A few sentences is plenty.', draft.problem, LIMITS.problem)}
      />
      <Textarea
        id="msf-solution"
        label="Solution"
        rows={5}
        value={draft.solution}
        onChange={(e) => change({ solution: e.target.value })}
        onBlur={() => touch('solution')}
        placeholder="How does your startup solve it?"
        aria-invalid={!!errors.solution}
        error={errors.solution}
        hint={hintWithCount('What you do differently, in plain words.', draft.solution, LIMITS.solution)}
      />
      <Textarea
        id="msf-targetCustomer"
        label="Target customer"
        rows={3}
        value={draft.targetCustomer}
        onChange={(e) => change({ targetCustomer: e.target.value })}
        onBlur={() => touch('targetCustomer')}
        placeholder="Who are you building this for?"
        aria-invalid={!!errors.targetCustomer}
        error={errors.targetCustomer}
        hint={hintWithCount(undefined, draft.targetCustomer, LIMITS.targetCustomer)}
      />
      <Textarea
        id="msf-whatBuilding"
        label="What you’re building"
        rows={3}
        value={draft.whatBuilding}
        onChange={(e) => change({ whatBuilding: e.target.value })}
        onBlur={() => touch('whatBuilding')}
        placeholder="What’s the product, concretely?"
        aria-invalid={!!errors.whatBuilding}
        error={errors.whatBuilding}
        hint={hintWithCount(undefined, draft.whatBuilding, LIMITS.whatBuilding)}
      />
      <Textarea
        id="msf-businessModel"
        label="Business model"
        rows={3}
        value={draft.businessModel}
        onChange={(e) => change({ businessModel: e.target.value })}
        onBlur={() => touch('businessModel')}
        placeholder="How do you make money?"
        aria-invalid={!!errors.businessModel}
        error={errors.businessModel}
        hint={hintWithCount(undefined, draft.businessModel, LIMITS.businessModel)}
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Looking for</p>
        <TagInput value={draft.needs} onChange={(needs) => change({ needs })} placeholder="e.g. Engineers, Funding, Mentors…" maxLength={LIMITS.need} />
        <p className="mt-1 text-xs text-fg-muted">The help you want from the community. Shown on your profile.</p>
      </div>
    </SectionForm>
  )
}
