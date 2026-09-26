import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdminOpportunity } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { PUBLISHER_IDENTITIES } from '@/lib/publisher-identities'
import { toast } from '@/store/toast.store'
import type { OpportunityType, PublisherIdentityKey, WorkMode } from '@/types'

const TYPES: OpportunityType[] = ['Full-time', 'Internship', 'Founding Role', 'Co-founder', 'Startup Project', 'AI/ML Role', 'Campus']
const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'In-person']

/**
 * Admin-only form to post an opportunity, mirroring the member PostOpportunityPage.tsx fields minus
 * a startup attribution — an admin posting is a platform-level listing, not tied to a specific
 * BuildAdda startup. postedByEmail: enter a member's email and they become the poster (and are told);
 * leave it empty and the admin account posts it. Unlike a member's own posting this is live at once,
 * not sent through the pending-review queue. Mount it only while it is open so its fields start fresh
 * each time.
 */
export function AdminOpportunityFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<OpportunityType>('Internship')
  const [organizationName, setOrganizationName] = useState('')
  const [location, setLocation] = useState('')
  const [workMode, setWorkMode] = useState<WorkMode>('In-person')
  const [description, setDescription] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [compensation, setCompensation] = useState('')
  const [equity, setEquity] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [postedByEmail, setPostedByEmail] = useState('')
  const [publisherIdentity, setPublisherIdentity] = useState<PublisherIdentityKey>('BUILDADDA')

  const mutation = useMutation({
    mutationFn: () =>
      createAdminOpportunity({
        title: title.trim(),
        type,
        organizationName: organizationName.trim(),
        location: location.trim(),
        workMode,
        description: description.trim(),
        responsibilities: responsibilities.trim(),
        requirements,
        requiredSkills,
        compensation: compensation.trim(),
        equity: equity.trim(),
        experienceLevel: experienceLevel.trim(),
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,
        postedByEmail: postedByEmail.trim(),
        publisherIdentity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success(postedByEmail.trim() ? 'Opportunity posted — the poster has been notified' : 'Opportunity posted — members can see it now')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post this opportunity'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add an opportunity"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || !organizationName.trim() || !description.trim()}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Post opportunity
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Opportunity type" value={type} onChange={(e) => setType(e.target.value as OpportunityType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Input label="Title" required value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI/ML Intern" />

        <Input
          label="Organization"
          required
          value={organizationName}
          maxLength={200}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="e.g. ABC Technologies"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Location" hint="Optional" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
          <Select label="Work mode" value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role…" rows={4} />

        <Textarea
          label="Responsibilities"
          hint="Optional"
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          placeholder="What will they actually be doing day to day?"
          rows={3}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Requirements</p>
          <TagInput value={requirements} onChange={setRequirements} placeholder="Add a requirement and press Enter…" maxLength={300} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Required skills</p>
          <TagInput value={requiredSkills} onChange={setRequiredSkills} placeholder="Add a skill and press Enter…" maxLength={300} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Compensation" hint="Optional" value={compensation} onChange={(e) => setCompensation(e.target.value)} placeholder="e.g. ₹20,000 – ₹30,000/month" />
          <Input label="Equity" hint="Optional" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="e.g. 0.25% – 1%" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Experience required" hint="Optional" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="e.g. 2-4 years" />
          <Input label="Application deadline" hint="Optional" type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} />
        </div>

        <Input
          label="Posted by (member's email)"
          hint="Optional. That member becomes the poster and is told. Leave empty to post under the admin account."
          type="email"
          value={postedByEmail}
          maxLength={255}
          onChange={(e) => setPostedByEmail(e.target.value)}
        />

        {!postedByEmail.trim() && (
          <Select
            label="Publisher identity"
            hint="Shown as the poster — not a separate user, still your admin account behind it"
            value={publisherIdentity}
            onChange={(e) => setPublisherIdentity(e.target.value as PublisherIdentityKey)}
          >
            {PUBLISHER_IDENTITIES.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </Select>
        )}
      </div>
    </Modal>
  )
}
