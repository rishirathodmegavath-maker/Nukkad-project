import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdminIdea } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { PUBLISHER_IDENTITIES } from '@/lib/publisher-identities'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { ContributionArea, IdeaStage, PublisherIdentityKey } from '@/types'

const STAGES: IdeaStage[] = ['Concept', 'Validating', 'Building', 'Launched']
const CONTRIBUTION_AREAS: ContributionArea[] = [
  'AI/ML', 'Technology', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'Domain Expertise',
]

/**
 * Admin-only form to post an idea, mirroring the member PostIdeaPage.tsx fields. creatorEmail: enter
 * a member's email and they become the creator (and are told); leave it empty and the admin account
 * posts it. Unlike a member's own idea this is live at once (approved), not sent through the
 * pending-review queue. Mount it only while it is open so its fields start fresh each time.
 */
export function AdminIdeaFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [stage, setStage] = useState<IdeaStage>('Concept')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [helpNeeded, setHelpNeeded] = useState<ContributionArea[]>([])
  const [creatorEmail, setCreatorEmail] = useState('')
  const [publisherIdentity, setPublisherIdentity] = useState<PublisherIdentityKey>('BUILDADDA')

  function toggleArea(area: ContributionArea) {
    setHelpNeeded((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createAdminIdea({
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        targetCustomer: targetCustomer.trim(),
        stage,
        category: category.trim(),
        tags,
        helpNeeded,
        creatorEmail: creatorEmail.trim(),
        publisherIdentity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ideas'] })
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success(creatorEmail.trim() ? 'Idea posted — the creator has been notified' : 'Idea posted — members can see it now')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post this idea'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Post an idea"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || !problem.trim() || !solution.trim()} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Post idea
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="A short, clear title" />
        <Textarea label="Problem" required value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="What problem are you solving?" />
        <Textarea label="Solution" required value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="How does this idea solve it?" />
        <Input label="Target customer" hint="Optional" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} placeholder="Who is this for?" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as IdeaStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input label="Category" hint="Optional — e.g. B2B SaaS" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Tags</p>
          <TagInput value={tags} onChange={setTags} placeholder="Add a tag and press Enter…" maxLength={50} />
        </div>

        <div>
          <p className="text-sm font-medium text-fg mb-2">Help needed</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTRIBUTION_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                  helpNeeded.includes(area)
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                )}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Creator's email"
          hint="Optional. A member with this email becomes the creator and is told. Leave empty to post under the admin account."
          type="email"
          value={creatorEmail}
          maxLength={255}
          onChange={(e) => setCreatorEmail(e.target.value)}
        />

        {!creatorEmail.trim() && (
          <Select
            label="Publisher identity"
            hint="Shown as the creator — not a separate user, still your admin account behind it"
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
