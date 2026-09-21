import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/domain/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { getOpportunity, postOpportunity, updateOpportunity } from '@/services/opportunities.service'
import { listMyFoundedStartups } from '@/services/startups.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from '@/store/toast.store'
import type { Opportunity, OpportunityType, WorkMode } from '@/types'

const TYPES: OpportunityType[] = [
  'Full-time',
  'Internship',
  'Founding Role',
  'Co-founder',
  'Startup Project',
  'AI/ML Role',
  'Campus',
]

const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'In-person']

type Step = 'form' | 'preview' | 'success'

export default function PostOpportunityPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()

  const [step, setStep] = useState<Step>('form')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<OpportunityType>('Internship')
  const [organizationName, setOrganizationName] = useState('')
  const [startupId, setStartupId] = useState(() => searchParams.get('startupId') ?? '')
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
  const [published, setPublished] = useState<Opportunity | null>(null)
  const [prefilled, setPrefilled] = useState(!isEdit)

  const { data: foundedStartups, isLoading: startupsLoading } = useQuery({
    queryKey: ['startups', 'me', 'founding'],
    queryFn: listMyFoundedStartups,
  })

  useEffect(() => {
    if (isEdit || !startupId || organizationName) return
    const startup = foundedStartups?.find((s) => s.id === startupId)
    if (startup) setOrganizationName(startup.name)
  }, [isEdit, startupId, organizationName, foundedStartups])

  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunity(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit || !existing || prefilled) return
    if (currentUser && existing.postedByUserId !== currentUser.id) {
      toast.error("You can't edit an opportunity you didn't post")
      navigate(`/opportunities/${id}`, { replace: true })
      return
    }
    setTitle(existing.title)
    setType(existing.type)
    setOrganizationName(existing.organizationName)
    setStartupId(existing.startupId ?? '')
    setLocation(existing.location)
    setWorkMode(existing.workMode)
    setDescription(existing.description)
    setResponsibilities(existing.responsibilities ?? '')
    setRequirements(existing.requirements)
    setRequiredSkills(existing.requiredSkills)
    setCompensation(existing.compensation ?? '')
    setEquity(existing.equity ?? '')
    setExperienceLevel(existing.experienceLevel ?? '')
    setApplicationDeadline(existing.applicationDeadline ? existing.applicationDeadline.slice(0, 10) : '')
    setPrefilled(true)
  }, [isEdit, existing, prefilled, currentUser, navigate, id])

  useEffect(() => {
    if (!isEdit && foundedStartups && foundedStartups.length === 0) {
      toast.error('Register a startup first — only founders can post an opportunity')
      navigate('/startups', { replace: true })
    }
  }, [isEdit, foundedStartups, navigate])

  function selectStartup(newStartupId: string) {
    setStartupId(newStartupId)
    const startup = foundedStartups?.find((s) => s.id === newStartupId)
    if (startup) setOrganizationName(startup.name)
  }

  const currentInput = () => ({
    title: title.trim(),
    type,
    startupId: startupId || undefined,
    organizationName: organizationName.trim(),
    location: location.trim() || undefined,
    workMode,
    description: description.trim(),
    responsibilities: responsibilities.trim() || undefined,
    requirements,
    requiredSkills,
    compensation: compensation.trim() || undefined,
    equity: equity.trim() || undefined,
    experienceLevel: experienceLevel.trim() || undefined,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,
  })

  const createMutation = useMutation({
    mutationFn: () => postOpportunity(currentInput()),
    onSuccess: (opp) => {
      // The posting starts PENDING (admin review), so refresh the places the owner will look for it:
      // "Posted by Me" and the linked startup's Open Positions.
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      if (opp.startupId) queryClient.invalidateQueries({ queryKey: ['startup', opp.startupId, 'opportunities'] })
      setPublished(opp)
      setStep('success')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit this opportunity'),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateOpportunity(id!, currentInput()),
    onSuccess: (opp) => {
      // Seed the detail page's cache directly (same key it reads) so it shows the fresh
      // data immediately instead of the pre-edit snapshot for the rest of its staleTime.
      queryClient.setQueryData(['opportunity', opp.id], opp)
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('Opportunity updated')
      navigate(`/opportunities/${opp.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this opportunity'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !organizationName.trim() || !description.trim()) {
      toast.error('Fill in the required fields first')
      return
    }
    if (isEdit) {
      updateMutation.mutate()
    } else {
      setStep('preview')
    }
  }

  if ((isEdit && (existingLoading || !prefilled)) || startupsLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (step === 'success' && published) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-xl font-bold text-fg">Submitted for review</h1>
        <p className="text-sm text-fg-muted">
          It’ll be public once an admin approves it. Until then only you can see it — track its status under Posted by Me.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" onClick={() => navigate('/opportunities/posted')}>
            Posted by Me
          </Button>
          <Button onClick={() => navigate(`/opportunities/${published.id}`)}>View Opportunity</Button>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    const preview = currentInput()
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Preview" description="This is how your opportunity will appear to other members." />
        <Card className="rounded-xl border border-border/80 shadow-xs p-6 sm:p-7 flex flex-col gap-4">
          <Badge tone="neutral">{preview.type}</Badge>
          <div>
            <h2 className="text-xl font-black text-fg tracking-tight">{preview.title || 'Untitled opportunity'}</h2>
            <p className="text-sm text-fg-muted flex items-center gap-1.5 mt-1 font-medium">
              <Briefcase className="size-3.5" /> {preview.organizationName}
            </p>
            {(preview.location || preview.workMode) && (
              <p className="text-xs text-fg-muted flex items-center gap-1.5 mt-1">
                <MapPin className="size-3.5" /> {preview.location}
                {preview.location && preview.workMode && ' · '}
                {preview.workMode}
              </p>
            )}
          </div>
          <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">{preview.description}</p>
          {preview.responsibilities && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Responsibilities</p>
              <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">{preview.responsibilities}</p>
            </div>
          )}
          {preview.requirements && preview.requirements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Requirements</p>
              <ul className="list-disc list-inside text-sm text-fg-secondary space-y-1">
                {preview.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          {preview.requiredSkills && preview.requiredSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {preview.requiredSkills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(preview.compensation || preview.equity || preview.experienceLevel || preview.applicationDeadline) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-border/60">
              {preview.compensation && (
                <p className="text-xs font-semibold text-fg-secondary flex items-center gap-1.5">
                  <IndianRupee className="size-3.5" /> {preview.compensation}
                </p>
              )}
              {preview.equity && <p className="text-xs font-semibold text-fg-secondary">Equity: {preview.equity}</p>}
              {preview.experienceLevel && (
                <p className="text-xs font-semibold text-fg-secondary">Experience: {preview.experienceLevel}</p>
              )}
              {preview.applicationDeadline && (
                <p className="text-xs font-semibold text-fg-secondary">
                  Apply by {new Date(preview.applicationDeadline).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Card>
        <div className="flex items-center justify-end gap-3 pt-5">
          <Button variant="ghost" onClick={() => setStep('form')}>
            Back to edit
          </Button>
          <Button size="lg" isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Submit for review
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={isEdit ? 'Edit opportunity' : 'Post an opportunity'}
        description={
          isEdit
            ? 'Update the details below.'
            : 'Share a job, internship, founding role, or co-founder opening with the BuildAdda community.'
        }
      />
      <Card className="rounded-xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Select label="Opportunity type" required value={type} onChange={(e) => setType(e.target.value as OpportunityType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI/ML Intern" maxLength={200} />

          {foundedStartups && foundedStartups.length > 0 && (
            <Select
              label="Startup"
              hint="Optional — attach this to one of your startups"
              value={startupId}
              onChange={(e) => selectStartup(e.target.value)}
            >
              <option value="">No startup — post as an organization</option>
              {foundedStartups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Organization"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g. ABC Technologies"
            maxLength={200}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
            <Select label="Work mode" required value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role…"
            rows={5}
          />

          <Textarea
            label="Responsibilities"
            hint="Optional"
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="What will they actually be doing day to day?"
            rows={4}
          />

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Requirements</p>
            <TagInput value={requirements} onChange={setRequirements} placeholder="Add a requirement and press Enter…" maxLength={300} />
          </div>

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Required skills</p>
            <TagInput value={requiredSkills} onChange={setRequiredSkills} placeholder="Add a skill and press Enter…" maxLength={300} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Compensation"
              hint="Optional"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder="e.g. ₹20,000 – ₹30,000/month"
            />
            <Input
              label="Equity"
              hint="Optional"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="e.g. 0.25% – 1%"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Experience required"
              hint="Optional"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              placeholder="e.g. 2-4 years"
            />
            <Input
              label="Application deadline"
              hint="Optional"
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate(isEdit ? `/opportunities/${id}` : '/opportunities')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={updateMutation.isPending}>
              {isEdit ? 'Save changes' : 'Preview'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
