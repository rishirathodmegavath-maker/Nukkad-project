import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Link2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea, Input, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import * as opportunitiesService from '@/services/opportunities.service'
import { toast } from '@/store/toast.store'
import type { Availability } from '@/types'

const AVAILABILITY_OPTIONS: Availability[] = ['Full-time', 'Part-time', 'Weekends', 'Not available']

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface ApplyToOpportunityModalProps {
  opportunityId: string
  opportunityTitle: string
  open: boolean
  onClose: () => void
}

function ApplyForm({
  opportunityId,
  opportunityTitle,
  onClose,
}: {
  opportunityId: string
  opportunityTitle: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: me } = useCurrentUser()

  const [whyInterested, setWhyInterested] = useState('')
  const [whyGoodFit, setWhyGoodFit] = useState('')
  const [skills, setSkills] = useState<string[]>(() => me?.skills ?? [])
  const [experienceIds, setExperienceIds] = useState<string[]>(() => (me?.experiences ?? []).map((e) => e.id))
  const [projectIds, setProjectIds] = useState<string[]>(() => (me?.projects ?? []).map((p) => p.id))
  const [availability, setAvailability] = useState<string>(() => me?.availability ?? '')
  const [expectedCommitment, setExpectedCommitment] = useState('')
  const [additionalMessage, setAdditionalMessage] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      opportunitiesService.applyToOpportunity(opportunityId, {
        whyInterested: whyInterested.trim(),
        whyGoodFit: whyGoodFit.trim(),
        relevantSkills: skills,
        experienceIds: experienceIds,
        projectIds: projectIds,
        availability: (availability as Availability) || undefined,
        expectedCommitment: expectedCommitment.trim() || undefined,
        additionalMessage: additionalMessage.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] })
      queryClient.invalidateQueries({ queryKey: ['applications', opportunityId] })
      toast.success('Application submitted')
      onClose()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not submit application')
    },
  })

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Apply to Opportunity"
      description={`Submit your application for "${opportunityTitle}".`}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!whyInterested.trim() || !whyGoodFit.trim()}
          >
            Submit Application
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {me && (
          <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-sunken/40 p-3">
            <Avatar src={me.avatarUrl} name={me.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg truncate">{me.name}</p>
              <p className="text-xs text-fg-muted truncate">{me.headline}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0 text-fg-muted">
              {me.socialLinks?.portfolio && <Globe className="size-3.5" />}
              {(me.socialLinks?.github || me.socialLinks?.linkedin) && <Link2 className="size-3.5" />}
            </div>
          </div>
        )}

        <Textarea
          label="Why are you interested?"
          required
          value={whyInterested}
          onChange={(e) => setWhyInterested(e.target.value)}
          placeholder="What draws you to this opportunity specifically?"
        />

        <Textarea
          label="Why are you a good fit?"
          required
          value={whyGoodFit}
          onChange={(e) => setWhyGoodFit(e.target.value)}
          placeholder="Relevant skills, experience, or context that makes you a strong candidate."
        />

        {me && me.skills.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-2">Relevant skills</p>
            <div className="flex flex-wrap gap-1.5">
              {me.skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSkills((prev) => toggle(prev, skill))}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                    skills.includes(skill)
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {me && (me.experiences ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-2">Relevant experience</p>
            <div className="flex flex-col gap-1.5">
              {(me.experiences ?? []).map((exp) => (
                <label
                  key={exp.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    id={`apply-experience-${exp.id}`}
                    name={`apply-experience-${exp.id}`}
                    checked={experienceIds.includes(exp.id)}
                    onChange={() => setExperienceIds((prev) => toggle(prev, exp.id))}
                    className="size-4 rounded border-border accent-brand-600"
                  />
                  <span className="text-fg">
                    {exp.role} · <span className="text-fg-muted">{exp.company}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {me && me.projects.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-2">Relevant projects</p>
            <div className="flex flex-col gap-1.5">
              {me.projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    id={`apply-project-${project.id}`}
                    name={`apply-project-${project.id}`}
                    checked={projectIds.includes(project.id)}
                    onChange={() => setProjectIds((prev) => toggle(prev, project.id))}
                    className="size-4 rounded border-border accent-brand-600"
                  />
                  <span className="text-fg">{project.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">Prefer not to say</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input
            label="Expected commitment"
            hint="e.g. 5–10 hrs/week"
            value={expectedCommitment}
            onChange={(e) => setExpectedCommitment(e.target.value)}
            placeholder="5–10 hrs/week"
          />
        </div>

        <Textarea
          label="Additional message (optional)"
          value={additionalMessage}
          onChange={(e) => setAdditionalMessage(e.target.value)}
          placeholder="Anything else the poster should know?"
        />
      </div>
    </Modal>
  )
}

export function ApplyToOpportunityModal({ opportunityId, opportunityTitle, open, onClose }: ApplyToOpportunityModalProps) {
  if (!open) return null
  return <ApplyForm opportunityId={opportunityId} opportunityTitle={opportunityTitle} onClose={onClose} />
}
