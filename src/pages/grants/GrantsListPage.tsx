import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Landmark, Plus } from 'lucide-react'
import { listGrants } from '@/services/grants.service'
import { GrantCard } from '@/components/domain/GrantCard'
import { PageHeader } from '@/components/domain/PageHeader'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { PillTabs } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import type { GrantProviderType } from '@/types'

const PROVIDER_TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All providers' },
  { key: 'Government', label: 'Government' },
  { key: 'Accelerator', label: 'Accelerator' },
  { key: 'Corporate', label: 'Corporate' },
  { key: 'Foundation', label: 'Foundation' },
  { key: 'Other', label: 'Other' },
]

const STAGES = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

export default function GrantsListPage() {
  const [query, setQuery] = useState('')
  const [providerType, setProviderType] = useState('all')
  const [stage, setStage] = useState('')

  const filters = useMemo(
    () => ({
      query: query || undefined,
      providerType: providerType === 'all' ? undefined : (providerType as GrantProviderType),
      stage: stage || undefined,
    }),
    [query, providerType, stage],
  )

  const { data: grants, isLoading, isError, refetch } = useQuery({ queryKey: ['grants', filters], queryFn: () => listGrants(filters) })

  return (
    <div>
      <PageHeader
        title="Grants & Schemes"
        description="Government schemes, accelerator programs, and funding opportunities for founders."
        action={
          <Link to="/grants/new">
            <Button leftIcon={<Plus className="size-4" />}>Add a grant</Button>
          </Link>
        }
      />
      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Filter grants by name or provider…">
        <div className="flex flex-wrap items-center gap-3">
          <PillTabs items={PROVIDER_TYPE_FILTERS} value={providerType} onChange={setProviderType} />
          <Select value={stage} onChange={(e) => setStage(e.target.value)} className="w-auto">
            <option value="">Any stage</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </SearchFilterBar>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : isError ? (
        <ErrorState title="Couldn't load grants" onRetry={refetch} />
      ) : grants && grants.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {grants.map((g) => (
            <GrantCard key={g.id} grant={g} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Landmark className="size-5" />}
          title="No grants match yet"
          description="Government schemes, accelerator funding, and corporate programs shared by the community will show up here."
          action={
            <Link to="/grants/new">
              <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                Add a grant
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
