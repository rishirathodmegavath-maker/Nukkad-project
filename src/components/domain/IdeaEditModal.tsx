import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { updateIdea } from '@/services/ideas.service'
import { toast } from '@/store/toast.store'
import type { ContributionArea, Idea, IdeaStage } from '@/types'

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

export function IdeaEditModal({ open, onClose, idea }: { open: boolean; onClose: () => void; idea: Idea }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(idea.title)
  const [problem, setProblem] = useState(idea.problem)
  const [solution, setSolution] = useState(idea.solution)
  const [targetCustomer, setTargetCustomer] = useState(idea.targetCustomer)
  const [stage, setStage] = useState<IdeaStage>(idea.stage)
  const [category, setCategory] = useState(idea.category)
  const [tagsInput, setTagsInput] = useState(idea.tags.join(', '))
  const [helpNeeded, setHelpNeeded] = useState<ContributionArea[]>(idea.helpNeeded)

  function toggleArea(area: ContributionArea) {
    setHelpNeeded((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateIdea(idea.id, {
        title,
        problem,
        solution,
        targetCustomer,
        stage,
        category,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        helpNeeded,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', idea.id] })
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('Idea updated')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update idea'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit idea" size="lg">
      <div className="flex flex-col gap-5">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Problem" value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} />
        <Textarea label="Solution" value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} />
        <Input label="Target customer" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as IdeaStage)}>
            <option value="Concept">Concept</option>
            <option value="Validating">Validating</option>
            <option value="Building">Building</option>
            <option value="Launched">Launched</option>
          </Select>
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <Input label="Tags" hint="Comma-separated" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />

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

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
