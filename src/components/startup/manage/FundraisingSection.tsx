import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Eye, EyeOff, Landmark } from 'lucide-react'
import { closeFundraise, createFundraise, getFundraiseByStartup, reopenFundraise, updateFundraise } from '@/services/investors.service'
import { updateStartup } from '@/services/startups.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { LIMITS, hintWithCount } from '@/components/startup/create/create-startup-model'
import { describeSaveFailure, parseAmount, type SectionKey } from '@/components/startup/manage/manage-model'
import { STARTUP_STAGES } from '@/lib/startup-meta'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { Fundraise, Startup, StartupStage } from '@/types'
import type { UpdateFundraiseInput } from '@/services/investors.service'

interface RoundDraft {
  fundingStage: StartupStage
  targetAmount: string
  amountRaised: string
  minimumTicket: string
  useOfFunds: string
}

type RoundErrors = Partial<Record<keyof RoundDraft, string>>

function draftOf(fundraise: Fundraise | null, startupStage: StartupStage): RoundDraft {
  if (!fundraise) return { fundingStage: startupStage, targetAmount: '', amountRaised: '', minimumTicket: '', useOfFunds: '' }
  return {
    fundingStage: fundraise.fundingStage as StartupStage,
    targetAmount: String(fundraise.targetAmount),
    amountRaised: String(fundraise.amountRaised),
    minimumTicket: fundraise.minimumTicket && fundraise.minimumTicket > 0 ? String(fundraise.minimumTicket) : '',
    useOfFunds: fundraise.useOfFunds ?? '',
  }
}

function normalized(draft: RoundDraft) {
  return {
    ...draft,
    targetAmount: draft.targetAmount.replace(/[,\s₹]/g, ''),
    amountRaised: draft.amountRaised.replace(/[,\s₹]/g, ''),
    minimumTicket: draft.minimumTicket.replace(/[,\s₹]/g, ''),
    useOfFunds: draft.useOfFunds.trim(),
  }
}

function problemsOf(draft: RoundDraft): RoundErrors {
  const errors: RoundErrors = {}
  if (!draft.targetAmount.trim()) errors.targetAmount = 'Enter how much you’re raising.'
  else if ((parseAmount(draft.targetAmount) ?? 0) < 1) errors.targetAmount = 'Enter a whole number of rupees greater than zero, for example 5000000.'
  if (draft.amountRaised.trim() && parseAmount(draft.amountRaised) === undefined) errors.amountRaised = 'Enter a whole number of rupees, or leave it empty.'
  if (draft.minimumTicket.trim() && parseAmount(draft.minimumTicket) === undefined) errors.minimumTicket = 'Enter a whole number of rupees, or leave it empty.'
  if (draft.useOfFunds.trim().length > LIMITS.problem) errors.useOfFunds = `Use of funds is too long: ${draft.useOfFunds.trim().length} of ${LIMITS.problem} characters. Please shorten it.`
  return errors
}

/** "₹50.0L" under an amount as it is typed, so a missing zero is easy to spot. */
function amountHint(raw: string, fallback?: string): string | undefined {
  const value = parseAmount(raw)
  return value !== undefined && value > 0 ? `That is ${formatCurrency(value)}` : fallback
}

interface RoundFormProps {
  startup: Startup
  fundraise: Fundraise | null
  onDirtyChange: (dirty: boolean) => void
}

/** The round's numbers: starting a fundraise when there is none, editing it while it is open. */
function RoundForm({ startup, fundraise, onDirtyChange }: RoundFormProps) {
  const queryClient = useQueryClient()
  const creating = !fundraise
  const initial = useMemo(() => draftOf(fundraise, startup.stage), [fundraise, startup.stage])
  const [baseline, setBaseline] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [attempted, setAttempted] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const dirty = JSON.stringify(normalized(draft)) !== JSON.stringify(normalized(baseline))
  useEffect(() => {
    onDirtyChange(dirty)
    // The form goes away when the round closes or is created; it must not leave the page believing it is unsaved.
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

  const problems = problemsOf(draft)
  const shown: RoundErrors = attempted ? problems : {}
  const raised = parseAmount(draft.amountRaised)
  const target = parseAmount(draft.targetAmount)

  function change(patch: Partial<RoundDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setFailure(null)
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['fundraise'] })
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }

  const create = useMutation({
    mutationFn: () =>
      createFundraise({
        startupId: startup.id,
        targetAmount: parseAmount(draft.targetAmount) ?? 0,
        fundingStage: draft.fundingStage,
        useOfFunds: draft.useOfFunds.trim() || undefined,
        minimumTicket: parseAmount(draft.minimumTicket),
      }),
    onSuccess: () => {
      refresh()
      toast.success('Fundraising started. Your startup now shows as raising.')
    },
    onError: (err) => setFailure(describeSaveFailure(err).message),
  })

  const update = useMutation({
    mutationFn: () => {
      const now = normalized(draft)
      const was = normalized(baseline)
      const patch: UpdateFundraiseInput = {}
      if (now.fundingStage !== was.fundingStage) patch.fundingStage = now.fundingStage
      if (now.targetAmount !== was.targetAmount) patch.targetAmount = parseAmount(now.targetAmount) ?? 0
      if (now.amountRaised !== was.amountRaised) patch.amountRaised = parseAmount(now.amountRaised) ?? 0
      // Leaving the field empty means "no minimum", which the server stores as zero (it ignores a missing value).
      if (now.minimumTicket !== was.minimumTicket) patch.minimumTicket = parseAmount(now.minimumTicket) ?? 0
      if (now.useOfFunds !== was.useOfFunds) patch.useOfFunds = now.useOfFunds
      return updateFundraise(fundraise!.id, patch)
    },
    onSuccess: (saved) => {
      const next = draftOf(saved, startup.stage)
      setBaseline(next)
      setDraft(next)
      setAttempted(false)
      setFailure(null)
      refresh()
      toast.success('Fundraising saved')
    },
    onError: (err) => setFailure(describeSaveFailure(err).message),
  })

  const saving = create.isPending || update.isPending

  function submit(e: FormEvent) {
    e.preventDefault()
    if (saving || (!creating && !dirty)) return
    setAttempted(true)
    const first = (Object.keys(problems) as (keyof RoundDraft)[])[0]
    if (first) {
      requestAnimationFrame(() => document.getElementById(`msf-round-${first}`)?.focus())
      return
    }
    if (creating) create.mutate()
    else update.mutate()
  }

  return (
    <SectionCard
      title={creating ? 'Start a fundraise' : 'Round details'}
      description={creating ? 'This marks your startup as raising, so it shows up as raising to the people who can see your fundraising.' : 'What you’re raising, what you’ve raised so far, and what it’s for.'}
      icon={<Landmark className="size-4" />}
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select id="msf-round-fundingStage" label="Funding stage" value={draft.fundingStage} onChange={(e) => change({ fundingStage: e.target.value as StartupStage })}>
            {STARTUP_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </Select>
          <Input
            id="msf-round-targetAmount"
            label="Target amount (₹)"
            required
            inputMode="numeric"
            value={draft.targetAmount}
            onChange={(e) => change({ targetAmount: e.target.value })}
            placeholder="e.g. 5000000"
            autoComplete="off"
            aria-invalid={!!shown.targetAmount}
            error={shown.targetAmount}
            hint={amountHint(draft.targetAmount)}
          />
          {!creating && (
            <Input
              id="msf-round-amountRaised"
              label="Amount raised so far (₹)"
              inputMode="numeric"
              value={draft.amountRaised}
              onChange={(e) => change({ amountRaised: e.target.value })}
              placeholder="0"
              autoComplete="off"
              aria-invalid={!!shown.amountRaised}
              error={shown.amountRaised}
              hint={
                raised !== undefined && target !== undefined && raised > target
                  ? 'More than the target. That’s fine if the round is oversubscribed.'
                  : amountHint(draft.amountRaised)
              }
            />
          )}
          <Input
            id="msf-round-minimumTicket"
            label="Minimum ticket (₹)"
            inputMode="numeric"
            value={draft.minimumTicket}
            onChange={(e) => change({ minimumTicket: e.target.value })}
            placeholder="Optional"
            autoComplete="off"
            aria-invalid={!!shown.minimumTicket}
            error={shown.minimumTicket}
            hint={amountHint(draft.minimumTicket, 'The smallest cheque you’ll take. Leave empty for no minimum.')}
          />
        </div>
        <Textarea
          id="msf-round-useOfFunds"
          label="Use of funds"
          rows={4}
          value={draft.useOfFunds}
          onChange={(e) => change({ useOfFunds: e.target.value })}
          placeholder="What will the money be spent on?"
          aria-invalid={!!shown.useOfFunds}
          error={shown.useOfFunds}
          hint={hintWithCount(undefined, draft.useOfFunds, LIMITS.problem)}
        />
        {creating && <p className="text-xs text-fg-muted">Once the round is open you can record how much you’ve raised so far.</p>}

        {failure && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-sm text-danger-500">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{failure}</span>
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fg-muted" aria-live="polite">
            {creating ? 'Nothing is shared until you start the fundraise.' : dirty ? 'You have unsaved changes.' : 'Everything is saved.'}
          </p>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            {!creating && (
              <Button
                type="button"
                variant="ghost"
                disabled={!dirty || saving}
                onClick={() => {
                  setDraft(baseline)
                  setAttempted(false)
                  setFailure(null)
                }}
              >
                Discard changes
              </Button>
            )}
            <Button type="submit" isLoading={saving} disabled={!creating && !dirty}>
              {creating ? 'Start fundraise' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </SectionCard>
  )
}

function ClosedSummary({ fundraise }: { fundraise: Fundraise }) {
  return (
    <SectionCard title="Last round" description="This round is closed, so its details can’t be edited. Raise again to open it back up." icon={<Landmark className="size-4" />}>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Funding stage', fundraise.fundingStage],
          ['Target', formatCurrency(fundraise.targetAmount)],
          ['Raised', formatCurrency(fundraise.amountRaised)],
          ...(fundraise.minimumTicket && fundraise.minimumTicket > 0 ? [['Minimum ticket', formatCurrency(fundraise.minimumTicket)]] : []),
        ].map(([label, value]) => (
          <Card key={label} padding="sm" variant="sunken" className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</dt>
            <dd className="mt-1 text-base font-semibold text-fg [overflow-wrap:anywhere]">{value}</dd>
          </Card>
        ))}
      </dl>
      {fundraise.useOfFunds?.trim() && <p className="mt-4 whitespace-pre-line text-sm text-fg-secondary [overflow-wrap:anywhere]">{fundraise.useOfFunds.trim()}</p>}
    </SectionCard>
  )
}

interface FundraisingSectionProps {
  startup: Startup
  onDirtyChange: (dirty: boolean) => void
  onGo: (section: SectionKey) => void
}

/**
 * Raising now or not, and the round behind it. Starting, editing, stopping and raising again all go through the
 * fundraise the startup already has; "Raising now" on the profile follows it. Who may see it is set under Visibility.
 */
export function FundraisingSection({ startup, onDirtyChange, onGo }: FundraisingSectionProps) {
  const queryClient = useQueryClient()
  const [confirmStop, setConfirmStop] = useState(false)
  const query = useQuery({
    queryKey: ['fundraise', 'by-startup', startup.id],
    // No fundraise is null, an answer in its own right; a query can't resolve to undefined.
    queryFn: async () => (await getFundraiseByStartup(startup.id)) ?? null,
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['fundraise'] })
    queryClient.invalidateQueries({ queryKey: ['startup', startup.id] })
    queryClient.invalidateQueries({ queryKey: ['startups'] })
  }
  const fail = (fallback: string) => (err: unknown) => toast.error(err instanceof Error && err.message ? err.message : fallback)

  const stop = useMutation({
    mutationFn: (id: string) => closeFundraise(id),
    onSuccess: () => {
      refresh()
      setConfirmStop(false)
      toast.info('You’re no longer marked as raising')
    },
    onError: (err) => {
      setConfirmStop(false)
      fail('Could not stop the fundraise')(err)
    },
  })
  const raiseAgain = useMutation({
    mutationFn: (id: string) => reopenFundraise(id),
    onSuccess: () => {
      refresh()
      toast.success('You’re raising again')
    },
    onError: fail('Could not open the fundraise again'),
  })
  const markNotRaising = useMutation({
    mutationFn: () => updateStartup(startup.id, { isRaising: false }),
    onSuccess: () => {
      refresh()
      toast.info('You’re no longer marked as raising')
    },
    onError: fail('Could not update your raising status'),
  })

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (query.isError) return <ErrorState title="Couldn’t load fundraising" onRetry={() => query.refetch()} />

  const fundraise = query.data
  const isOpen = fundraise?.status === 'Open'
  const isClosed = fundraise?.status === 'Closed'
  // The profile says "Raising now" but there is no round behind it (set before fundraising had its own page).
  const orphanedFlag = !fundraise && startup.isRaising
  const rejected = startup.moderationStatus === 'REJECTED'

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-fg">Fundraising</h2>
            {isOpen ? (
              <Badge tone="accent" dot>
                Raising now
              </Badge>
            ) : (
              <Badge tone="neutral">{isClosed ? 'Round closed' : 'Not raising'}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {isOpen
              ? 'Your profile shows that you’re raising. Stop when the round is done.'
              : isClosed
                ? 'You’ve stopped raising. Raise again to reopen the same round.'
                : orphanedFlag
                  ? 'Your profile says you’re raising, but there are no round details behind it yet. Add them below, or mark yourself as not raising.'
                  : 'Start a fundraise to show that you’re raising and to share the details of your round.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isOpen && fundraise && (
            <Button variant="secondary" onClick={() => setConfirmStop(true)}>
              Stop raising
            </Button>
          )}
          {isClosed && fundraise && !rejected && (
            <Button isLoading={raiseAgain.isPending} onClick={() => raiseAgain.mutate(fundraise.id)}>
              Raise again
            </Button>
          )}
          {orphanedFlag && (
            <Button variant="secondary" isLoading={markNotRaising.isPending} onClick={() => markNotRaising.mutate()}>
              Mark as not raising
            </Button>
          )}
        </div>
      </Card>

      {rejected && !fundraise && (
        <p role="status" className="rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-sm text-danger-500">
          An admin didn’t approve this startup, so it can’t raise funds.
        </p>
      )}

      {!isClosed && !(rejected && !fundraise) && (
        <RoundForm key={fundraise ? `${fundraise.id}:${fundraise.status}` : 'new'} startup={startup} fundraise={fundraise ?? null} onDirtyChange={onDirtyChange} />
      )}
      {isClosed && fundraise && <ClosedSummary fundraise={fundraise} />}

      <Card padding="sm" variant="sunken" className="flex flex-col gap-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {startup.fundraisingVisible ? (
            <Eye className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden="true" />
          ) : (
            <EyeOff className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden="true" />
          )}
          <p className="text-sm text-fg-secondary">
            <span className="font-semibold text-fg">Fundraising visibility: {startup.fundraisingVisible ? 'Show' : 'Hide'}.</span>{' '}
            {startup.fundraisingVisible
              ? 'Everyone who can see your startup can see your round.'
              : 'Only your team can see your round and “Raising now”, and you don’t appear in the Raising Now filter.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onGo('visibility')}>
          Change visibility
        </Button>
      </Card>

      <Modal
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop raising?"
        description="Your profile will no longer show “Raising now”, and you’ll leave the Raising Now filter. You can raise again any time."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmStop(false)}>
              Keep raising
            </Button>
            <Button variant="danger" isLoading={stop.isPending} onClick={() => fundraise && stop.mutate(fundraise.id)}>
              Stop raising
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">The details of your round are kept.</p>
      </Modal>
    </div>
  )
}
