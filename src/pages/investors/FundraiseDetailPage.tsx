import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, XCircle, ChevronRight } from 'lucide-react'
import { getFundraise, closeFundraise } from '@/services/investors.service'
import { getStartup, getStartupMembers } from '@/services/startups.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { FundraiseEditModal } from '@/components/domain/FundraiseEditModal'
import { IntroRequestModal } from '@/components/domain/IntroRequestModal'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/store/toast.store'

export default function FundraiseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)

  const { data: fundraise, isLoading, isError, refetch } = useQuery({
    queryKey: ['fundraise', id],
    queryFn: () => getFundraise(id!),
    enabled: !!id,
  })

  const { data: startup } = useQuery({
    queryKey: ['startup', fundraise?.startupId],
    queryFn: () => getStartup(fundraise!.startupId),
    enabled: !!fundraise,
  })

  const { data: members } = useQuery({
    queryKey: ['startup', fundraise?.startupId, 'members'],
    queryFn: () => getStartupMembers(fundraise!.startupId),
    enabled: !!fundraise,
  })
  const founder = members?.find((m) => m.isFounder)

  const closeMutation = useMutation({
    mutationFn: () => closeFundraise(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraise', id] })
      if (fundraise) queryClient.invalidateQueries({ queryKey: ['startup', fundraise.startupId] })
      toast.info('Fundraise closed')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not close this fundraise'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !fundraise) {
    return <ErrorState title="Couldn’t load this fundraise" onRetry={refetch} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/investors" className="hover:text-fg transition-colors">
          Investors & Fundraises
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{startup?.name ? `${startup.name} Round` : 'Fundraise Round'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-2xl border border-border/80 shadow-xs bg-surface p-6 sm:p-7">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Badge tone="accent">{fundraise.fundingStage}</Badge>
              <Badge tone={fundraise.status === 'Open' ? 'success' : 'neutral'}>{fundraise.status}</Badge>
            </div>
            {fundraise.canManage && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                {fundraise.status === 'Open' && (
                  <Button variant="danger-subtle" size="sm" leftIcon={<XCircle className="size-3.5" />} isLoading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
                    Close
                  </Button>
                )}
              </div>
            )}
          </div>
          {startup && (
            <Link to={`/startups/${startup.id}`} className="flex items-center gap-3 mb-4 group">
              <Avatar src={startup.logoUrl} name={startup.name} size="md" />
              <div>
                <p className="font-semibold text-fg group-hover:underline">{startup.name}</p>
                <p className="text-sm text-fg-muted">{startup.tagline}</p>
              </div>
            </Link>
          )}
          <div className="h-2.5 rounded-full bg-surface-sunken overflow-hidden mb-2">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${Math.min(100, (fundraise.amountRaised / fundraise.targetAmount) * 100)}%` }}
            />
          </div>
          <p className="text-sm text-fg-secondary">
            {formatCurrency(fundraise.amountRaised)} of {formatCurrency(fundraise.targetAmount)} raised
          </p>

          {fundraise.useOfFunds && (
            <div className="mt-5 pt-5 border-t border-border-subtle">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Use of funds</p>
              <p className="text-sm text-fg-secondary leading-relaxed">{fundraise.useOfFunds}</p>
            </div>
          )}
          {fundraise.minimumTicket !== undefined && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Minimum ticket</p>
              <p className="text-sm text-fg-secondary">{formatCurrency(fundraise.minimumTicket)}</p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {!fundraise.canManage && founder && (
          <Card>
            <p className="text-sm text-fg-secondary mb-3">Interested in this round?</p>
            <Button className="w-full" onClick={() => setIntroOpen(true)}>
              Request introduction
            </Button>
          </Card>
        )}
        <p className="text-xs text-fg-muted px-1">
          BuildAdda only facilitates discovery and introductions here — no funds move through the platform.
        </p>
      </div>
    </div>

    <FundraiseEditModal open={editOpen} onClose={() => setEditOpen(false)} fundraise={fundraise} />
    {founder && (
      <IntroRequestModal
        open={introOpen}
        onClose={() => setIntroOpen(false)}
        recipientId={founder.userId}
        direction="INVESTOR_TO_FOUNDER"
        startupId={fundraise.startupId}
        contextLabel={startup?.name}
      />
    )}
  </div>
)
}
