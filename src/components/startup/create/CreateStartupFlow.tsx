import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react'
import { addStartupTeamMember, createStartup, uploadStartupLogo } from '@/services/startups.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PageHeader } from '@/components/domain/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Stepper } from '@/components/ui/Stepper'
import { StepShell } from '@/components/startup/create/StepShell'
import { StepBasics } from '@/components/startup/create/StepBasics'
import { StepStartup } from '@/components/startup/create/StepStartup'
import { StepBusiness } from '@/components/startup/create/StepBusiness'
import { StepTraction } from '@/components/startup/create/StepTraction'
import { StepTeam } from '@/components/startup/create/StepTeam'
import { StepReview } from '@/components/startup/create/StepReview'
import { CreateStartupDone, type CreateResult } from '@/components/startup/create/CreateStartupDone'
import {
  INITIAL_DRAFT,
  STEPS,
  buildCreateInput,
  describeCreateFailure,
  fieldsOfStep,
  isDraftDirty,
  validateAll,
  validateStep,
  type CreateFailure,
  type CreateStartupDraft,
  type FieldErrors,
  type FieldKey,
  type StepKey,
} from '@/components/startup/create/create-startup-model'

const STEP_COPY: Record<StepKey, { title: string; description: string }> = {
  basics: {
    title: 'Let’s start with the basics',
    description: 'Give your startup a name and, if you like, a logo. Only the name is required.',
  },
  startup: {
    title: 'About your startup',
    description: 'What stage are you at, and what problem are you solving? It’s all optional, but it helps people understand what you’re building.',
  },
  business: {
    title: 'Your business',
    description: 'Who is it for, how does it earn, and what help are you looking for?',
  },
  traction: {
    title: 'Your traction',
    description: 'Share the progress you’ve made so far. Skip anything that doesn’t apply.',
  },
  team: {
    title: 'Your team',
    description: 'You’re the Founder. Add anyone who’s building this with you.',
  },
  review: {
    title: 'Review and create',
    description: 'Check everything below. You can edit any part before you create your startup.',
  },
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'an unexpected error'
}

/**
 * The six-step "Create Startup" journey. The answers live here while the person moves between steps; nothing is saved
 * or published until "Create Startup" on the last step, which creates the startup in one call and then uploads the logo
 * and adds the teammates through the same calls the profile uses.
 */
export function CreateStartupFlow() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me } = useCurrentUser()

  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<CreateStartupDraft>(INITIAL_DRAFT)
  const [touched, setTouched] = useState<Set<FieldKey>>(() => new Set())
  const [attempted, setAttempted] = useState<Set<StepKey>>(() => new Set())
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [failure, setFailure] = useState<CreateFailure | null>(null)
  const [returnToReview, setReturnToReview] = useState(false)
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<CreateResult | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)

  // A second click (or Enter) while the first request is still running must not create a second startup.
  const submitLock = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openedOnce = useRef(false)
  const previewUrl = useRef<string | undefined>(undefined)

  const step = STEPS[stepIndex]
  const isReview = step.key === 'review'
  const defaultChapterId = me?.chapterId ?? ''
  const dirty = isDraftDirty(draft)

  useEffect(() => {
    previewUrl.current = draft.logo?.previewUrl
  }, [draft.logo])
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    },
    [],
  )

  // Moving to another step starts at its heading, so the person (and a screen reader) lands at the top of it.
  useEffect(() => {
    if (!openedOnce.current) {
      openedOnce.current = true
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'start' })
  }, [stepIndex])

  // Refreshing or closing the tab would lose the answers, so the browser asks first.
  useEffect(() => {
    if (!dirty || result) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, result])

  function change(patch: Partial<CreateStartupDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
    // Once a field is edited the server's earlier complaint about it no longer applies.
    setServerErrors((prev) => {
      const keys = Object.keys(patch).filter((k) => k in prev)
      if (keys.length === 0) return prev
      const next = { ...prev }
      for (const k of keys) delete next[k as FieldKey]
      return next
    })
  }

  function markTouched(key: FieldKey) {
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }

  // Only errors the person has already been shown a reason to see: after leaving a field, or after pressing Continue.
  const stepErrors = validateStep(step.key, draft)
  const visibleErrors: FieldErrors = {}
  for (const key of fieldsOfStep(step.key)) {
    const message = serverErrors[key] ?? stepErrors[key]
    if (message && (serverErrors[key] || attempted.has(step.key) || touched.has(key))) visibleErrors[key] = message
  }
  const problems: FieldErrors = { ...validateAll(draft), ...serverErrors }

  function goTo(index: number, fromReview = false) {
    setReturnToReview(fromReview)
    setStepIndex(index)
  }

  function goToStep(key: StepKey) {
    goTo(
      STEPS.findIndex((s) => s.key === key),
      true,
    )
  }

  function next() {
    const errors = validateStep(step.key, draft)
    const first = fieldsOfStep(step.key).find((key) => errors[key])
    if (first) {
      setAttempted((prev) => new Set(prev).add(step.key))
      requestAnimationFrame(() => document.getElementById(`csf-${first}`)?.focus())
      return
    }
    goTo(returnToReview ? STEPS.length - 1 : stepIndex + 1)
  }

  async function create() {
    if (submitLock.current) return
    if (Object.keys(validateAll(draft)).length > 0) {
      setFailure(null)
      return
    }
    submitLock.current = true
    setCreating(true)
    setFailure(null)
    try {
      const startup = await createStartup(buildCreateInput(draft, defaultChapterId))

      // The startup exists now. The logo and the teammates go through the calls the profile already uses; if one
      // fails the startup is still created, and the result says exactly what to finish by hand.
      let logo: CreateResult['logo'] = 'none'
      let created = startup
      if (draft.logo) {
        try {
          created = await uploadStartupLogo(startup.id, draft.logo.file)
          logo = 'uploaded'
        } catch (err) {
          logo = { failed: errorMessage(err) }
        }
      }
      const added = await Promise.allSettled(draft.teammates.map((t) => addStartupTeamMember(startup.id, t.user.id, undefined, t.role)))
      const team = draft.teammates.map((t, i) => {
        const outcome = added[i]
        return {
          name: t.user.name,
          role: t.role,
          error: outcome.status === 'rejected' ? errorMessage(outcome.reason) : undefined,
        }
      })

      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setResult({ startup: created, logo, team })
    } catch (err) {
      const described = describeCreateFailure(err)
      setFailure(described)
      setServerErrors(described.fields)
    } finally {
      submitLock.current = false
      setCreating(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isReview) void create()
    else next()
  }

  function requestLeave() {
    if (dirty) setLeaveOpen(true)
    else navigate('/startups')
  }

  if (result) return <CreateStartupDone result={result} />

  const copy = STEP_COPY[step.key]
  const shared = { draft, errors: visibleErrors, onChange: change, onBlurField: markTouched }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Create your startup"
        description="Already building or running something, here or out in the world? Bring it to BuildAdda so the community can follow, join and support it."
        action={
          <Button type="button" variant="ghost" onClick={requestLeave}>
            Cancel
          </Button>
        }
      />

      <Card padding="sm" className="mb-3 sm:px-6 sm:py-5">
        <Stepper steps={[...STEPS]} current={stepIndex} onStepClick={(index) => goTo(index)} />
      </Card>
      <p className="mb-4 text-center text-xs text-fg-muted">Your answers are kept as you move between steps. Nothing is published until you create the startup.</p>

      <form noValidate onSubmit={handleSubmit}>
        <Card padding="md">
          <StepShell ref={headingRef} eyebrow={`Step ${stepIndex + 1} of ${STEPS.length}`} title={copy.title} description={copy.description}>
            {step.key === 'basics' && <StepBasics {...shared} defaultChapterId={defaultChapterId} />}
            {step.key === 'startup' && <StepStartup {...shared} />}
            {step.key === 'business' && <StepBusiness {...shared} />}
            {step.key === 'traction' && <StepTraction {...shared} />}
            {step.key === 'team' && <StepTeam draft={draft} onChange={change} />}
            {isReview && (
              <StepReview draft={draft} defaultChapterId={defaultChapterId} onEditStep={goToStep} onChange={change} problems={problems} failure={failure} />
            )}
          </StepShell>

          {Object.keys(visibleErrors).length > 0 && attempted.has(step.key) && (
            <p role="alert" className="mt-5 text-sm font-medium text-danger-500">
              Please fix the highlighted {Object.keys(visibleErrors).length === 1 ? 'field' : 'fields'} to continue.
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-2.5 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            {stepIndex > 0 ? (
              <Button type="button" variant="secondary" size="lg" leftIcon={<ArrowLeft className="size-4" />} disabled={creating} onClick={() => goTo(stepIndex - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {isReview ? (
              <Button type="submit" size="lg" isLoading={creating} leftIcon={<Rocket className="size-4" />}>
                Create Startup
              </Button>
            ) : (
              <Button type="submit" size="lg" rightIcon={<ArrowRight className="size-4" />}>
                {returnToReview ? 'Save and back to review' : 'Continue'}
              </Button>
            )}
          </div>
        </Card>
      </form>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave without creating?"
        description="You’ve started filling this in. If you leave now, your answers are lost."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => navigate('/startups')}>
              Discard and leave
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Nothing has been created yet.</p>
      </Modal>
    </div>
  )
}
