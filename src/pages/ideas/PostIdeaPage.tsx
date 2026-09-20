import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/domain/PageHeader'
import { cn } from '@/lib/utils'
import * as ideasService from '@/services/ideas.service'
import type { ContributionArea, IdeaStage } from '@/types'
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

export default function PostIdeaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [stage, setStage] = useState<IdeaStage>('Concept')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [helpNeeded, setHelpNeeded] = useState<ContributionArea[]>([])

  const mutation = useMutation({
    mutationFn: () =>
      ideasService.postIdea({
        title,
        problem,
        solution,
        targetCustomer,
        stage,
        category,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        helpNeeded,
      }),
    onSuccess: (idea) => {
      // New ideas go through admin review first, so don't claim it's live. Refresh the lists so the
      // owner's pending idea shows up (with its status) in "My ideas" straight away.
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('Submitted for review — it’ll be public once approved. Track it under “My ideas”.')
      navigate(`/ideas/${idea.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post idea'),
  })

  function toggleArea(area: ContributionArea) {
    setHelpNeeded((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Post an idea" description="Share the problem, your solution, and what kind of help you need." />
      <Card className="rounded-xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short, clear title" />
          <Textarea
            label="Problem"
            required
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What problem are you solving?"
          />
          <Textarea
            label="Solution"
            required
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="How does your idea solve it?"
          />
          <Input
            label="Target customer"
            required
            value={targetCustomer}
            onChange={(e) => setTargetCustomer(e.target.value)}
            placeholder="Who is this for?"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as IdeaStage)}>
              <option value="Concept">Concept</option>
              <option value="Validating">Validating</option>
              <option value="Building">Building</option>
              <option value="Launched">Launched</option>
            </Select>
            <Input label="Category" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. B2B SaaS" />
          </div>
          <Input
            label="Tags"
            hint="Comma-separated"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="AI, Fintech, Marketplace"
          />

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

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate('/ideas')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={mutation.isPending}>
              Post idea
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
