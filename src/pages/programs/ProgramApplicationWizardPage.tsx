import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import { getMyProgramApplication, getProgram, saveProgramApplicationDraft, submitProgramApplication } from '@/services/programs.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Stepper, type StepItem } from '@/components/ui/Stepper'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { ErrorState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'
import type { ProgramField, ProgramKey } from '@/types'

const VALID_KEYS: ProgramKey[] = ['spark', 'ignite']
const MULTISELECT_DELIMITER = '|'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/
const URL_RE = /^https?:\/\/.+/i

function fieldError(field: ProgramField, value: string): string | undefined {
  if (field.required && !value.trim()) return 'This field is required'
  if (!value.trim()) return undefined
  if (field.type === 'EMAIL' && !EMAIL_RE.test(value)) return 'Enter a valid email address'
  if (field.type === 'PHONE' && !PHONE_RE.test(value)) return 'Enter a valid phone number'
  if (field.type === 'URL' && !URL_RE.test(value)) return 'Enter a link starting with http:// or https://'
  return undefined
}

function MultiSelectField({ field, value, onChange }: { field: ProgramField; value: string; onChange: (v: string) => void }) {
  const selected = useMemo(() => new Set(value ? value.split(MULTISELECT_DELIMITER) : []), [value])
  function toggle(option: string) {
    const next = new Set(selected)
    if (next.has(option)) next.delete(option)
    else next.add(option)
    onChange(Array.from(next).join(MULTISELECT_DELIMITER))
  }
  return (
    <div role="group" aria-label={field.label} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-secondary">{field.label}</span>
      <div className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const active = selected.has(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                active ? 'border-brand-500/30 bg-brand-500/10 text-fg-brand' : 'border-border/80 bg-surface text-fg-secondary hover:bg-surface-hover',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FieldInput({ field, value, error, onChange }: { field: ProgramField; value: string; error?: string; onChange: (v: string) => void }) {
  if (field.type === 'MULTISELECT') return <MultiSelectField field={field} value={value} onChange={onChange} />
  if (field.type === 'SELECT') {
    return (
      <Select label={field.label} required={field.required} error={error} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose an option…</option>
        {field.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>
    )
  }
  if (field.type === 'TEXTAREA') {
    return <Textarea label={field.label} required={field.required} error={error} rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
  }
  const inputType = field.type === 'EMAIL' ? 'email' : field.type === 'DATE' ? 'date' : field.type === 'PHONE' ? 'tel' : field.type === 'URL' ? 'url' : 'text'
  return <Input label={field.label} required={field.required} error={error} type={inputType} value={value} onChange={(e) => onChange(e.target.value)} />
}

export default function ProgramApplicationWizardPage() {
  const { key } = useParams<{ key: string }>()
  const normalized = key?.toLowerCase()
  const valid = VALID_KEYS.includes(normalized as ProgramKey)
  const programKey = normalized as ProgramKey
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: program, isLoading, isError, refetch } = useQuery({
    queryKey: ['program', normalized],
    queryFn: () => getProgram(programKey),
    enabled: valid,
  })
  const { data: existing, isLoading: isLoadingMine } = useQuery({
    queryKey: ['program-application', 'mine', normalized],
    queryFn: () => getMyProgramApplication(programKey),
    enabled: valid,
  })

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  // Adjusted during render, not an effect (same idiom as SearchFilterBar's liveValue sync): once the
  // query resolves, seed local state from it exactly once — a plain effect would set state one
  // render late, letting the very first paint flash empty fields before snapping to the real draft.
  if (!hydrated && existing !== undefined) {
    setHydrated(true)
    setAnswers(existing?.status === 'DRAFT' ? existing.answers : {})
  }

  const saveDraftMutation = useMutation({
    mutationFn: (values: Record<string, string>) => saveProgramApplicationDraft(programKey, values),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save your progress'),
  })
  const submitMutation = useMutation({
    mutationFn: () => submitProgramApplication(programKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-application'] })
      navigate(`/programs/${programKey}/apply/confirmation`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit your application'),
  })

  if (!valid) return <Navigate to="/programs" replace />
  if (isLoading || isLoadingMine || !hydrated) return <RouteFallback />
  if (isError || !program) return <ErrorState title="Couldn't load this program" onRetry={refetch} />
  if (existing && existing.status !== 'DRAFT') {
    return <Navigate to={`/programs/${programKey}/apply`} replace />
  }

  const steps = program.applicationSteps
  const reviewIndex = steps.length - 1
  const isReviewStep = stepIndex === reviewIndex
  const currentStep = steps[stepIndex]
  const stepItems: StepItem[] = steps.map((s) => ({ key: s.id, label: s.title }))

  function setAnswer(fieldKey: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }))
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev
      const next = { ...prev }
      delete next[fieldKey]
      return next
    })
  }

  function validateStep(stepFields: ProgramField[]): boolean {
    const stepErrors: Record<string, string> = {}
    for (const field of stepFields) {
      const message = fieldError(field, answers[field.key] ?? '')
      if (message) stepErrors[field.key] = message
    }
    setErrors((prev) => ({ ...prev, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  async function handleNext() {
    if (!validateStep(currentStep.fields)) {
      toast.error('Please fix the highlighted fields')
      return
    }
    const stepAnswers = Object.fromEntries(currentStep.fields.map((f) => [f.key, answers[f.key] ?? '']))
    if (currentStep.fields.length > 0) {
      try {
        await saveDraftMutation.mutateAsync(stepAnswers)
      } catch {
        return
      }
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function handleSubmit() {
    // Validate every step (not just the current one) before letting the server reject it.
    let allValid = true
    for (const step of steps) {
      if (!validateStep(step.fields)) allValid = false
    }
    if (!allValid) {
      toast.error('Please complete every required field before submitting')
      const firstInvalid = steps.findIndex((s) => s.fields.some((f) => fieldError(f, answers[f.key] ?? '')))
      if (firstInvalid >= 0) setStepIndex(firstInvalid)
      return
    }
    submitMutation.mutate()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{program.name} Application</h1>
        <p className="mt-1 text-sm text-fg-muted">Your progress is saved automatically as you move between steps.</p>
      </div>

      <Stepper steps={stepItems} current={stepIndex} onStepClick={setStepIndex} />

      {isReviewStep ? (
        <Card className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-fg">Review your application</h2>
          {steps.slice(0, reviewIndex).map((step, i) => (
            <div key={step.id} className="flex flex-col gap-2 border-b border-border/60 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg">{step.title}</h3>
                <button type="button" onClick={() => setStepIndex(i)} className="flex items-center gap-1 text-xs font-semibold text-fg-brand hover:underline">
                  <Pencil className="size-3" aria-hidden="true" /> Edit
                </button>
              </div>
              {step.fields.map((f) => {
                const value = answers[f.key]
                if (!value) return null
                return (
                  <div key={f.key} className="text-sm">
                    <span className="text-fg-muted">{f.label}: </span>
                    <span className="font-medium text-fg">{f.type === 'MULTISELECT' ? value.split(MULTISELECT_DELIMITER).join(', ') : value}</span>
                  </div>
                )
              })}
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={handleBack}>
              Back
            </Button>
            <Button isLoading={submitMutation.isPending} onClick={handleSubmit}>
              Submit Application <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-fg">{currentStep.title}</h2>
          {currentStep.fields.map((field) => (
            <FieldInput key={field.key} field={field} value={answers[field.key] ?? ''} error={errors[field.key]} onChange={(v) => setAnswer(field.key, v)} />
          ))}
          <div className="flex items-center justify-between gap-3">
            {stepIndex > 0 ? (
              <Button variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={handleBack}>
                Back
              </Button>
            ) : (
              <Link to={`/programs/${programKey}/apply`} className="text-sm font-medium text-fg-muted hover:text-fg hover:underline">
                Save &amp; exit
              </Link>
            )}
            <Button isLoading={saveDraftMutation.isPending} onClick={handleNext}>
              Continue <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
