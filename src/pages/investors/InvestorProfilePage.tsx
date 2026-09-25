import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Globe, ChevronRight } from 'lucide-react'
import { getInvestor, deleteInvestorProfile } from '@/services/investors.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { InvestorProfileEditModal } from '@/components/domain/InvestorProfileEditModal'
import { IntroRequestModal } from '@/components/domain/IntroRequestModal'
import { formatCurrency } from '@/lib/utils'
import { safeHref } from '@/lib/links'
import { toast } from '@/store/toast.store'

export default function InvestorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { data: currentUser } = useCurrentUser()

  const { data: investor, isLoading, isError, refetch } = useQuery({
    queryKey: ['investor', id],
    queryFn: () => getInvestor(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvestorProfile(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] })
      toast.info('Investor profile deleted')
      navigate('/investors')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this investor profile')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !investor) {
    return <ErrorState title="Couldn’t load this investor" onRetry={refetch} />
  }

  const name = investor.user?.name ?? 'Investor'
  const isOwnProfile = currentUser?.id === investor.userId

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/investors" className="hover:text-fg transition-colors">
          Investors
        </Link>
        <ChevronRight className="size-3 text-fg-muted/60" />
        <span className="text-fg truncate max-w-[240px] sm:max-w-md">{name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            <Avatar src={investor.user?.avatarUrl} name={name} size="xl" />
            <div>
              <Link to={`/people/${investor.userId}`} className="hover:underline">
                <h1 className="text-xl font-bold text-fg">{name}</h1>
              </Link>
              {investor.user?.headline && <p className="text-sm text-fg-muted mt-0.5">{investor.user.headline}</p>}
              {investor.firmName && <p className="text-sm text-fg-muted">{investor.firmName}</p>}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge tone="brand">{investor.investorType}</Badge>
                {investor.sectors.map((s) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {investor.canManage ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button
                variant="danger-subtle"
                size="sm"
                leftIcon={<Trash2 className="size-3.5" />}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          ) : (
            !isOwnProfile && <Button size="sm" onClick={() => setIntroOpen(true)}>Request introduction</Button>
          )}
        </Card>

        {investor.thesis && (
          <Card>
            <h2 className="font-semibold text-fg mb-2">Investment thesis</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">{investor.thesis}</p>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-3">
          {(investor.ticketMin !== undefined || investor.ticketMax !== undefined) && (
            <div>
              <p className="text-xs text-fg-muted">Ticket size</p>
              <p className="text-sm font-medium text-fg">
                {investor.ticketMin !== undefined ? formatCurrency(investor.ticketMin) : 'Any'} –{' '}
                {investor.ticketMax !== undefined ? formatCurrency(investor.ticketMax) : 'Any'}
              </p>
            </div>
          )}
          {investor.stages.length > 0 && (
            <div>
              <p className="text-xs text-fg-muted">Stage preference</p>
              <p className="text-sm font-medium text-fg">{investor.stages.join(', ')}</p>
            </div>
          )}
          {investor.geographies.length > 0 && (
            <div>
              <p className="text-xs text-fg-muted">Geography</p>
              <p className="text-sm font-medium text-fg">{investor.geographies.join(', ')}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-fg-muted">Portfolio</p>
            <p className="text-sm font-medium text-fg">{investor.portfolioCount} companies</p>
          </div>
          {safeHref(investor.website ?? '') && (
            <a href={safeHref(investor.website ?? '')!} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
              <Globe className="size-3.5" /> Website
            </a>
          )}
        </Card>

        {!investor.canManage && !isOwnProfile && (
          <p className="text-xs text-fg-muted px-1">
            BuildAdda only facilitates discovery and introductions here — no funds move through the platform.
          </p>
        )}
      </div>
    </div>

    <InvestorProfileEditModal open={editOpen} onClose={() => setEditOpen(false)} investor={investor} />
    <IntroRequestModal
      open={introOpen}
      onClose={() => setIntroOpen(false)}
      recipientId={investor.userId}
      recipientName={name}
      direction="FOUNDER_TO_INVESTOR"
    />

    <Modal
      open={confirmDeleteOpen}
      onClose={() => setConfirmDeleteOpen(false)}
      title="Delete this investor profile?"
      description="This removes your investor listing and any pending introduction requests tied to it. This action cannot be undone."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete profile
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">Are you sure you want to permanently delete your investor profile?</p>
    </Modal>
  </div>
)
}
