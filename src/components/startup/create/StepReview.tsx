import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Eye, Globe, Lock } from 'lucide-react'
import { listChapters } from '@/services/chapters.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { SectionCard } from '@/components/ui/SectionCard'
import { ChoiceCards } from '@/components/startup/ChoiceCards'
import { RichText } from '@/components/startup/ProfileParts'
import {
  FIELD_LABEL,
  FIELD_STEP,
  normalizeWebsite,
  type CreateFailure,
  type CreateStartupDraft,
  type FieldErrors,
  type FieldKey,
  type StepKey,
} from '@/components/startup/create/create-startup-model'
import { STAGE_TONE } from '@/lib/startup-meta'
import type { StartupVisibility } from '@/types'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

/** A value the person entered, or a quiet "Not provided": nothing is filled in on their behalf. */
function Value({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed) return <span className="text-fg-muted">Not provided</span>
  return <RichText className="text-sm text-fg">{trimmed}</RichText>
}

function EditButton({ step, label, onEdit }: { step: StepKey; label: string; onEdit: (step: StepKey) => void }) {
  return (
    <Button type="button" size="sm" variant="secondary" aria-label={`Edit ${label}`} onClick={() => onEdit(step)}>
      Edit
    </Button>
  )
}

interface StepReviewProps {
  draft: CreateStartupDraft
  defaultChapterId: string
  onEditStep: (step: StepKey) => void
  onChange: (patch: Partial<CreateStartupDraft>) => void
  /** Problems on any step that stop the startup being created, with where to fix them. */
  problems: FieldErrors
  /** What the server said the last time creating failed. */
  failure: CreateFailure | null
}

/** Step 6: everything in one place, each part editable, plus who can see the startup. Nothing exists until "Create Startup". */
export function StepReview({ draft, defaultChapterId, onEditStep, onChange, problems, failure }: StepReviewProps) {
  const { data: me } = useCurrentUser()
  const { data: chapters } = useQuery({ queryKey: ['chapters', 'all'], queryFn: () => listChapters() })
  const chapterId = draft.chapterId ?? defaultChapterId
  const chapterName = chapters?.find((c) => c.id === chapterId)?.name
  const problemKeys = Object.keys(problems) as FieldKey[]
  const website = normalizeWebsite(draft.website)

  return (
    <div className="flex flex-col gap-4">
      {(failure || problemKeys.length > 0) && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-500" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-fg [overflow-wrap:anywhere]">{failure ? failure.message : 'A few things need fixing before your startup can be created.'}</p>
            {problemKeys.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {problemKeys.map((key) => (
                  <li key={key} className="flex flex-wrap items-baseline gap-x-2 text-fg-secondary">
                    <span className="[overflow-wrap:anywhere]">{problems[key]}</span>
                    <button type="button" onClick={() => onEditStep(FIELD_STEP[key])} className="cursor-pointer text-xs font-semibold text-fg-brand hover:underline">
                      Fix {FIELD_LABEL[key].toLowerCase()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {failure && problemKeys.length === 0 && <p className="mt-1 text-fg-muted">Your answers are still here. Fix anything above, or just try again.</p>}
          </div>
        </div>
      )}

      <SectionCard title="Basics" action={<EditButton step="basics" label="basics" onEdit={onEditStep} />}>
        <div className="mb-4 flex min-w-0 items-center gap-3.5">
          <EntityLogo src={draft.logo?.previewUrl} name={draft.name || 'Your startup'} size="lg" />
          <div className="min-w-0">
            <p className="text-base font-bold text-fg [overflow-wrap:anywhere]">{draft.name.trim() || <span className="text-fg-muted">No name yet</span>}</p>
            <p className="text-xs text-fg-muted">{draft.logo ? 'Your logo will be uploaded when you create the startup.' : 'No logo. You can add one later from the profile.'}</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Tagline">
            <Value text={draft.tagline} />
          </Row>
          <Row label="Location">
            <Value text={draft.location} />
          </Row>
          <Row label="Website">{website ? <span>{website.replace(/^https?:\/\//i, '')}</span> : <span className="text-fg-muted">Not provided</span>}</Row>
          <Row label="Chapter">{chapterName ? chapterName : <span className="text-fg-muted">None (platform-wide)</span>}</Row>
        </dl>
      </SectionCard>

      <SectionCard title="Startup" action={<EditButton step="startup" label="startup details" onEdit={onEditStep} />}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Sector">
            <Value text={draft.sector} />
          </Row>
          <Row label="Stage">
            <Badge tone={STAGE_TONE[draft.stage] ?? 'neutral'} size="md">
              {draft.stage}
            </Badge>
          </Row>
          <Row label="Problem">
            <Value text={draft.problem} />
          </Row>
          <Row label="Solution">
            <Value text={draft.solution} />
          </Row>
        </dl>
      </SectionCard>

      <SectionCard title="Business" action={<EditButton step="business" label="business details" onEdit={onEditStep} />}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Target customer">
            <Value text={draft.targetCustomer} />
          </Row>
          <Row label="Business model">
            <Value text={draft.businessModel} />
          </Row>
          <Row label="What you’re building">
            <Value text={draft.whatBuilding} />
          </Row>
          <Row label="Looking for">
            {draft.needs.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {draft.needs.map((need) => (
                  <Badge key={need} tone="primary" size="md">
                    {need}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-fg-muted">Not provided</span>
            )}
          </Row>
        </dl>
      </SectionCard>

      <SectionCard title="Traction" description="Figures you provided. They aren’t verified." action={<EditButton step="traction" label="traction" onEdit={onEditStep} />}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Revenue">
            <Value text={draft.revenue} />
          </Row>
          <Row label="Customers">
            <Value text={draft.customers} />
          </Row>
          <Row label="Users">
            <Value text={draft.users} />
          </Row>
          <Row label="Growth">
            <Value text={draft.growth} />
          </Row>
          <Row label="Other traction">
            <Value text={draft.otherTraction} />
          </Row>
        </dl>
      </SectionCard>

      <SectionCard title="Team" action={<EditButton step="team" label="team" onEdit={onEditStep} />}>
        <ul className="flex flex-col gap-2.5">
          <li className="flex min-w-0 items-center gap-3">
            <Avatar src={me?.avatarUrl} name={me?.name ?? 'You'} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{me?.name ?? 'You'}</span>
            <Badge tone="primary">Founder</Badge>
          </li>
          {draft.teammates.map((t) => (
            <li key={t.user.id} className="flex min-w-0 items-center gap-3" data-testid="review-teammate">
              <Avatar src={t.user.avatarUrl} name={t.user.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{t.user.name}</span>
              <Badge tone={t.role === 'ADMIN' ? 'info' : 'neutral'}>{t.role === 'ADMIN' ? 'Admin' : 'Member'}</Badge>
            </li>
          ))}
        </ul>
        {draft.teammates.length === 0 && <p className="mt-3 text-xs text-fg-muted">Just you for now. You can add teammates any time from your startup’s Team tab.</p>}
      </SectionCard>

      <SectionCard title="Visibility" description="Who can see your startup. You can change these later in Edit.">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-fg-secondary">Who can see your startup</p>
            <ChoiceCards<StartupVisibility>
              label="Startup visibility"
              value={draft.visibility}
              onChange={(visibility) => onChange({ visibility })}
              options={[
                { value: 'Public', label: 'Public', description: 'Anyone can find and view your startup.', icon: <Globe className="size-3.5 text-fg-muted" aria-hidden="true" /> },
                { value: 'Nukkad Members', label: 'Nukkad Members', description: 'Only signed-in BuildAdda members can find and view it.', icon: <Lock className="size-3.5 text-fg-muted" aria-hidden="true" /> },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-fg-secondary">Fundraising visibility</p>
            <ChoiceCards<'show' | 'hide'>
              label="Fundraising visibility"
              value={draft.fundraisingVisible ? 'show' : 'hide'}
              onChange={(v) => onChange({ fundraisingVisible: v === 'show' })}
              options={[
                { value: 'show', label: 'Show', description: 'When you raise, people who can see your startup can see that you’re raising and the details.', icon: <Eye className="size-3.5 text-fg-muted" aria-hidden="true" /> },
                { value: 'hide', label: 'Hide', description: 'Only your team sees fundraising. Nobody else is told you’re raising.', icon: <Lock className="size-3.5 text-fg-muted" aria-hidden="true" /> },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <Card padding="sm" variant="sunken" className="text-sm text-fg-muted">
        Nothing is published until you press <strong className="font-semibold text-fg">Create Startup</strong>. Your startup goes live straight away, with no approval needed.
      </Card>
    </div>
  )
}
