import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStartup } from '@/services/startups.service'
import { describeSaveFailure } from '@/components/startup/manage/manage-model'
import type { FieldErrors, FieldKey } from '@/components/startup/create/create-startup-model'
import { toast } from '@/store/toast.store'
import type { Startup, UpdateStartupInput } from '@/types'

interface SectionFormOptions<T extends object> {
  startup: Startup
  /** The section's editable values, taken from the saved startup. Must be a stable (module-level) function. */
  toDraft: (startup: Startup) => T
  /** The values as the API wants them: trimmed, with lists joined. Only the ones that changed are sent. */
  toInput: (draft: T) => UpdateStartupInput
  /** What is wrong with the values right now. */
  validate: (draft: T) => FieldErrors
  /** Lets the page mark the section (and warn before leaving) while it has unsaved changes. */
  onDirtyChange?: (dirty: boolean) => void
  successMessage?: string
}

/** The keys whose value differs between two API inputs. */
function changedKeys(next: UpdateStartupInput, base: UpdateStartupInput): (keyof UpdateStartupInput)[] {
  return (Object.keys(next) as (keyof UpdateStartupInput)[]).filter((key) => JSON.stringify(next[key]) !== JSON.stringify(base[key]))
}

/**
 * The state behind one management form: what the person has typed, whether that differs from what is saved, which
 * mistakes to show, and the save itself. A save sends only the fields that changed, so two managers editing different
 * parts of the startup never overwrite each other. After a save the form takes the server's version of the values.
 */
export function useSectionForm<T extends object>({ startup, toDraft, toInput, validate, onDirtyChange, successMessage = 'Changes saved' }: SectionFormOptions<T>) {
  const queryClient = useQueryClient()
  const source = useMemo(() => toDraft(startup), [startup, toDraft])
  const [baseline, setBaseline] = useState<T>(source)
  const [draft, setDraft] = useState<T>(source)
  const [touched, setTouched] = useState<Set<FieldKey>>(() => new Set())
  const [attempted, setAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [failure, setFailure] = useState<string | null>(null)

  const dirty = JSON.stringify(toInput(draft)) !== JSON.stringify(toInput(baseline))

  // Someone else (another manager) saved a change: take it, unless this form has edits of its own that it would erase.
  const sourceKey = JSON.stringify(toInput(source))
  const [seenSourceKey, setSeenSourceKey] = useState(sourceKey)
  if (sourceKey !== seenSourceKey) {
    setSeenSourceKey(sourceKey)
    if (!dirty) {
      setBaseline(source)
      setDraft(source)
    }
  }

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const mutation = useMutation({
    mutationFn: (patch: UpdateStartupInput) => updateStartup(startup.id, patch),
    onSuccess: (saved) => {
      const next = toDraft(saved)
      setBaseline(next)
      setDraft(next)
      setAttempted(false)
      setTouched(new Set())
      setServerErrors({})
      setFailure(null)
      queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success(successMessage)
    },
    onError: (err) => {
      const described = describeSaveFailure(err)
      setFailure(described.message)
      setServerErrors(described.fields)
    },
  })

  const problems = validate(draft)
  const errors: FieldErrors = {}
  for (const key of Object.keys(problems) as FieldKey[]) {
    if (attempted || touched.has(key)) errors[key] = problems[key]
  }
  for (const key of Object.keys(serverErrors) as FieldKey[]) errors[key] = serverErrors[key]

  function change(patch: Partial<T>) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setFailure(null)
    setServerErrors((prev) => {
      const keys = Object.keys(patch).filter((k) => k in prev)
      if (keys.length === 0) return prev
      const next = { ...prev }
      for (const k of keys) delete next[k as FieldKey]
      return next
    })
  }

  function touch(key: FieldKey) {
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }

  function submit() {
    if (mutation.isPending || !dirty) return
    setAttempted(true)
    const firstBad = (Object.keys(problems) as FieldKey[])[0]
    if (firstBad) {
      requestAnimationFrame(() => document.getElementById(`msf-${firstBad}`)?.focus())
      return
    }
    const next = toInput(draft)
    const base = toInput(baseline)
    const patch: UpdateStartupInput = {}
    for (const key of changedKeys(next, base)) (patch as Record<string, unknown>)[key] = next[key]
    mutation.mutate(patch)
  }

  function discard() {
    setDraft(baseline)
    setAttempted(false)
    setTouched(new Set())
    setServerErrors({})
    setFailure(null)
  }

  return { draft, change, dirty, errors, touch, submit, discard, saving: mutation.isPending, failure }
}

export type SectionForm<T extends object> = ReturnType<typeof useSectionForm<T>>
