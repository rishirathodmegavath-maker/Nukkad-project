import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/domain/PageHeader'
import { createStartup } from '@/services/startups.service'
import { listChapters } from '@/services/chapters.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from '@/store/toast.store'
import type { StartupStage } from '@/types'

const STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

export default function RegisterStartupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [sector, setSector] = useState('')
  const [stage, setStage] = useState<StartupStage>('Early Traction')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [chapterId, setChapterId] = useState(currentUser?.chapterId ?? '')

  const { data: chapters } = useQuery({ queryKey: ['chapters', 'all'], queryFn: () => listChapters() })

  const mutation = useMutation({
    mutationFn: () =>
      createStartup({
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        sector: sector.trim() || undefined,
        stage,
        problem: problem.trim() || undefined,
        solution: solution.trim() || undefined,
        needs,
        chapterId: chapterId || undefined,
      }),
    onSuccess: (startup) => {
      // New startups go through admin review first. Refresh the lists so it shows up (with its
      // status) under "My Startup" straight away.
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success('Submitted for review — it’ll be public once approved. You can keep adding details from its profile.')
      navigate(`/startups/${startup.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not register your startup'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Give your startup a name first')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Register your startup"
        description="Already building or running something — inside Buildadda or out in the world? Bring it here so the community can follow, join, and support it."
      />
      <Card className="rounded-2xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Startup name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Swiggy" maxLength={200} />
            <Input label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Food delivery" />
          </div>

          <Input
            label="Tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="One line describing what you do"
            maxLength={300}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as StartupStage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
              <option value="">No chapter — platform-wide</option>
              {(chapters ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What problem does your startup solve?"
            rows={3}
          />
          <Textarea
            label="Solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="How do you solve it?"
            rows={3}
          />

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">What are you looking for?</p>
            <TagInput value={needs} onChange={setNeeds} placeholder="e.g. Engineers, Funding, Mentors…" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate('/startups')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={mutation.isPending}>
              Create Startup
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
