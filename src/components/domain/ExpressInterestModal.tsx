import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import * as ideasService from '@/services/ideas.service'
import type { ContributionArea } from '@/types'
import { toast } from '@/store/toast.store'

const CONTRIBUTION_AREAS: ContributionArea[] = [
  'AI/ML',
  'Technology',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Domain Expertise',
]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface ExpressInterestModalProps {
  ideaId: string
  ideaTitle: string
  open: boolean
  onClose: () => void
}

function ApplyForm({ ideaId, ideaTitle, onClose }: { ideaId: string; ideaTitle: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: me } = useCurrentUser()

  const [areas, setAreas] = useState<ContributionArea[]>([])
  const [message, setMessage] = useState('')
  const [skills, setSkills] = useState<string[]>(() => me?.skills ?? [])
  const [experienceIds, setExperienceIds] = useState<string[]>(() => (me?.experiences ?? []).map((e) => e.id))
  const [projectIds, setProjectIds] = useState<string[]>(() => (me?.projects ?? []).map((p) => p.id))

  const mutation = useMutation({
    mutationFn: () =>
      ideasService.expressInterest(ideaId, {
        contributionAreas: areas,
        message: message.trim() || undefined,
        relevantSkills: skills,
        experienceIds,
        projectIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] })
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('You’re in! The creator has been notified.')
      onClose()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not send interest')
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="I want to build this"
      description={`Let the creator of “${ideaTitle}” know how you’d like to contribute.`}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={areas.length === 0} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Send interest
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
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-fg mb-2">How would you contribute?</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTRIBUTION_AREAS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAreas((prev) => toggle(prev, option))}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                  areas.includes(option)
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A sentence on relevant experience goes a long way."
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
      </div>
    </Modal>
  )
}

export function ExpressInterestModal({ ideaId, ideaTitle, open, onClose }: ExpressInterestModalProps) {
  if (!open) return null
  return <ApplyForm ideaId={ideaId} ideaTitle={ideaTitle} onClose={onClose} />
}
