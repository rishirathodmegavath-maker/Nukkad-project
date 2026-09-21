import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/domain/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { getGrant, createGrant, updateGrant } from '@/services/grants.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from '@/store/toast.store'
import type { GrantProviderType } from '@/types'

const PROVIDER_TYPES: GrantProviderType[] = ['Government', 'Accelerator', 'Corporate', 'Foundation', 'Other']
const STAGES = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

export default function GrantFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [providerType, setProviderType] = useState<GrantProviderType>('Government')
  const [description, setDescription] = useState('')
  const [fundingAmount, setFundingAmount] = useState('')
  const [eligibilityCriteria, setEligibilityCriteria] = useState('')
  const [eligibleSectors, setEligibleSectors] = useState<string[]>([])
  const [eligibleStages, setEligibleStages] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [applicationUrl, setApplicationUrl] = useState('')
  const [prefilled, setPrefilled] = useState(!isEdit)

  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ['grant', id],
    queryFn: () => getGrant(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit || !existing || prefilled) return
    if (currentUser && existing.createdByUserId !== currentUser.id) {
      toast.error("You can't edit a grant you didn't add")
      navigate(`/grants/${id}`, { replace: true })
      return
    }
    setName(existing.name)
    setProvider(existing.provider)
    setProviderType(existing.providerType)
    setDescription(existing.description ?? '')
    setFundingAmount(existing.fundingAmount ?? '')
    setEligibilityCriteria(existing.eligibilityCriteria ?? '')
    setEligibleSectors(existing.eligibleSectors)
    setEligibleStages(existing.eligibleStages)
    setDeadline(existing.deadline ? existing.deadline.slice(0, 10) : '')
    setApplicationUrl(existing.applicationUrl)
    setPrefilled(true)
  }, [isEdit, existing, prefilled, currentUser, navigate, id])

  function toggleStage(stage: string) {
    setEligibleStages((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]))
  }

  const currentInput = () => ({
    name: name.trim(),
    provider: provider.trim(),
    providerType,
    description: description.trim() || undefined,
    fundingAmount: fundingAmount.trim() || undefined,
    eligibilityCriteria: eligibilityCriteria.trim() || undefined,
    eligibleSectors,
    eligibleStages,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    applicationUrl: applicationUrl.trim(),
  })

  const createMutation = useMutation({
    mutationFn: () => createGrant(currentInput()),
    onSuccess: (grant) => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      toast.success('Grant added')
      navigate(`/grants/${grant.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this grant'),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateGrant(id!, currentInput()),
    onSuccess: (grant) => {
      queryClient.setQueryData(['grant', grant.id], grant)
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      toast.success('Grant updated')
      navigate(`/grants/${grant.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this grant'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !provider.trim() || !applicationUrl.trim()) {
      toast.error('Fill in the required fields first')
      return
    }
    if (isEdit) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  if (isEdit && (existingLoading || !prefilled)) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={isEdit ? 'Edit grant' : 'Add a grant'}
        description={
          isEdit
            ? 'Update the details below.'
            : 'Share a government scheme, accelerator program, or funding opportunity with the BuildAdda community.'
        }
      />
      <Card className="rounded-xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input label="Grant / scheme name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Startup India Seed Fund" maxLength={200} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Provider" required value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Govt of India" maxLength={200} />
            <Select label="Provider type" required value={providerType} onChange={(e) => setProviderType(e.target.value as GrantProviderType)}>
              {PROVIDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this grant for?"
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Funding amount"
              hint="Optional"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              placeholder="e.g. Up to ₹50L, equity-free"
            />
            <Input
              label="Application deadline"
              hint="Optional — leave blank if rolling"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Textarea
            label="Eligibility criteria"
            hint="Optional"
            value={eligibilityCriteria}
            onChange={(e) => setEligibilityCriteria(e.target.value)}
            placeholder="Who can apply?"
            rows={3}
          />

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Eligible stages</p>
            <p className="text-xs text-fg-muted mb-2">Leave all unselected to make this open to every stage.</p>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => {
                const active = eligibleStages.includes(stage)
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => toggleStage(stage)}
                    className={
                      active
                        ? 'rounded-full px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white cursor-pointer'
                        : 'rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-sunken text-fg-secondary hover:bg-surface-hover cursor-pointer'
                    }
                  >
                    {stage}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Eligible sectors</p>
            <p className="text-xs text-fg-muted mb-2">Leave empty to make this open to every sector.</p>
            <TagInput value={eligibleSectors} onChange={setEligibleSectors} placeholder="Add a sector and press Enter…" />
          </div>

          <Input
            label="Application URL"
            required
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            placeholder="The provider's own application page"
          />

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate(isEdit ? `/grants/${id}` : '/grants')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? 'Save changes' : 'Add grant'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
