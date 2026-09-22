import { Info } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { LIMITS, hintWithCount, type FieldErrors } from '@/components/startup/create/create-startup-model'
import { SectionForm } from '@/components/startup/manage/SectionForm'
import { checkFields } from '@/components/startup/manage/manage-model'
import { useSectionForm } from '@/components/startup/manage/useSectionForm'
import type { Startup, UpdateStartupInput } from '@/types'

interface TractionDraft {
  revenue: string
  customers: string
  users: string
  growth: string
  otherTraction: string
}

function toDraft(startup: Startup): TractionDraft {
  return {
    revenue: startup.revenue,
    customers: startup.customers,
    users: startup.users,
    growth: startup.growth,
    // Startups from before traction had its own fields keep their old free-text note here.
    otherTraction: startup.otherTraction || startup.traction,
  }
}

function toInput(draft: TractionDraft): UpdateStartupInput {
  return {
    revenue: draft.revenue.trim(),
    customers: draft.customers.trim(),
    users: draft.users.trim(),
    growth: draft.growth.trim(),
    otherTraction: draft.otherTraction.trim(),
  }
}

function validate(draft: TractionDraft): FieldErrors {
  return checkFields(['revenue', 'customers', 'users', 'growth', 'otherTraction'], draft)
}

/** The progress figures a founder chooses to share. They are typed by the founder and shown as such; nothing here is measured or verified. */
export function TractionSection({ startup, onDirtyChange }: { startup: Startup; onDirtyChange: (dirty: boolean) => void }) {
  const form = useSectionForm({ startup, toDraft, toInput, validate, onDirtyChange, successMessage: 'Traction saved' })
  const { draft, errors, change, touch } = form

  return (
    <SectionForm title="Traction" description="Whatever you can share: exact numbers, ranges, or a short note all work." form={form}>
      <p className="flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2.5 text-xs text-fg-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        These figures are entered by you and shown on your profile as founder-provided. BuildAdda doesn’t verify them.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="msf-revenue"
          label="Revenue"
          value={draft.revenue}
          onChange={(e) => change({ revenue: e.target.value })}
          onBlur={() => touch('revenue')}
          placeholder="e.g. ₹10L MRR"
          autoComplete="off"
          aria-invalid={!!errors.revenue}
          error={errors.revenue}
          hint={hintWithCount(undefined, draft.revenue, LIMITS.revenue)}
        />
        <Input
          id="msf-customers"
          label="Customers"
          value={draft.customers}
          onChange={(e) => change({ customers: e.target.value })}
          onBlur={() => touch('customers')}
          placeholder="e.g. 450 paying customers"
          autoComplete="off"
          aria-invalid={!!errors.customers}
          error={errors.customers}
          hint={hintWithCount(undefined, draft.customers, LIMITS.customers)}
        />
        <Input
          id="msf-users"
          label="Users"
          value={draft.users}
          onChange={(e) => change({ users: e.target.value })}
          onBlur={() => touch('users')}
          placeholder="e.g. 12,500 monthly active users"
          autoComplete="off"
          aria-invalid={!!errors.users}
          error={errors.users}
          hint={hintWithCount(undefined, draft.users, LIMITS.users)}
        />
        <Input
          id="msf-growth"
          label="Growth"
          value={draft.growth}
          onChange={(e) => change({ growth: e.target.value })}
          onBlur={() => touch('growth')}
          placeholder="e.g. 20% month on month"
          autoComplete="off"
          aria-invalid={!!errors.growth}
          error={errors.growth}
          hint={hintWithCount(undefined, draft.growth, LIMITS.growth)}
        />
      </div>
      <Textarea
        id="msf-otherTraction"
        label="Other traction"
        rows={4}
        value={draft.otherTraction}
        onChange={(e) => change({ otherTraction: e.target.value })}
        onBlur={() => touch('otherTraction')}
        placeholder="Anything else worth sharing: press, partnerships, waitlist size…"
        aria-invalid={!!errors.otherTraction}
        error={errors.otherTraction}
        hint={hintWithCount(undefined, draft.otherTraction, LIMITS.otherTraction)}
      />
    </SectionForm>
  )
}
