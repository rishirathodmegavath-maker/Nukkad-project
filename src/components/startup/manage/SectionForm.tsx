import type { FormEvent, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/SectionCard'
import type { SectionForm as SectionFormState } from '@/components/startup/manage/useSectionForm'

interface SectionFormProps<T extends object> {
  title: string
  description: string
  form: SectionFormState<T>
  children: ReactNode
}

/** One management section: its fields, and a save bar that says whether anything has changed. Enter in a field saves. */
export function SectionForm<T extends object>({ title, description, form, children }: SectionFormProps<T>) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    form.submit()
  }

  return (
    <SectionCard title={title} description={description}>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {children}

        {form.failure && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-sm text-danger-500">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{form.failure}</span>
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fg-muted" aria-live="polite">
            {form.dirty ? 'You have unsaved changes.' : 'Everything is saved.'}
          </p>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button type="button" variant="ghost" disabled={!form.dirty || form.saving} onClick={form.discard}>
              Discard changes
            </Button>
            <Button type="submit" isLoading={form.saving} disabled={!form.dirty}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </SectionCard>
  )
}
