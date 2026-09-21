import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdminStartup, listAdminResourceChapters } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { toast } from '@/store/toast.store'
import type { StartupStage } from '@/types'

const STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

/**
 * Admin-only form to add a startup. Same fields as a member registering their own, plus the founder: enter a member's
 * email and they become the founder and can manage it; leave it empty and the admin account owns it. The startup is live
 * for members as soon as it is added. Mount it only while it is open so its fields start fresh each time.
 */
export function AdminStartupFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [tagline, setTagline] = useState('')
  const [stage, setStage] = useState<StartupStage>('Early Traction')
  const [chapterId, setChapterId] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [founderEmail, setFounderEmail] = useState('')

  // The admin token can't call the member chapters API, so the chapter picker uses the admin chapter list.
  const { data: chapters } = useQuery({ queryKey: ['admin', 'resource-chapters'], queryFn: listAdminResourceChapters })

  const mutation = useMutation({
    mutationFn: () =>
      createAdminStartup({
        name: name.trim(),
        sector: sector.trim(),
        tagline: tagline.trim(),
        stage,
        problem: problem.trim(),
        solution: solution.trim(),
        needs,
        chapterId,
        founderEmail: founderEmail.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'startups'] })
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success(founderEmail.trim() ? 'Startup added — the founder has been notified' : 'Startup added — members can see it now')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this startup'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a startup"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Add startup
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Startup name" required value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
          <Input label="Sector" hint="Optional — e.g. Food delivery" value={sector} maxLength={100} onChange={(e) => setSector(e.target.value)} />
        </div>
        <Input label="Tagline" hint="Optional — one line on what they do" value={tagline} maxLength={300} onChange={(e) => setTagline(e.target.value)} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <Input
          label="Founder's email"
          hint="Optional. A member with this email becomes the founder and can edit the startup. Leave empty to add it under the admin account, which can't be edited from the member app."
          type="email"
          value={founderEmail}
          maxLength={255}
          onChange={(e) => setFounderEmail(e.target.value)}
        />

        <Textarea label="Problem" hint="Optional" value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} />
        <Textarea label="Solution" hint="Optional" value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">What are they looking for?</p>
          <TagInput value={needs} onChange={setNeeds} placeholder="e.g. Engineers, Funding, Mentors…" maxLength={100} />
        </div>
      </div>
    </Modal>
  )
}
