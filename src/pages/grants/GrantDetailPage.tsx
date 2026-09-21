import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark, ExternalLink, Pencil, Trash2, ChevronRight, CalendarClock, IndianRupee } from 'lucide-react'
import { getGrant, deleteGrant } from '@/services/grants.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/store/toast.store'

export default function GrantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: grant, isLoading, isError, refetch } = useQuery({
    queryKey: ['grant', id],
    queryFn: () => getGrant(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteGrant(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      toast.info('Grant removed')
      navigate('/grants')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this grant')
      setConfirmDeleteOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !grant) {
    return <ErrorState title="Couldn't load this grant" onRetry={refetch} />
  }

  const isExpired = !!grant.deadline && new Date(grant.deadline).getTime() < Date.now()

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/grants" className="hover:text-fg transition-colors">
          Grants
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{grant.name}</span>
      </div>

      {grant.canManage && grant.moderationStatus === 'PENDING' && (
        <Card className="border border-warning-500/30 bg-warning-500/5 flex items-center gap-3">
          <Badge tone="warning">Pending review</Badge>
          <p className="text-sm text-fg-secondary">
            This grant listing is waiting on admin approval and isn't visible to anyone else yet.
          </p>
        </Card>
      )}
      {grant.canManage && grant.moderationStatus === 'REJECTED' && (
        <Card className="border border-danger-500/30 bg-danger-500/5 flex items-center gap-3">
          <Badge tone="danger">Not approved</Badge>
          <p className="text-sm text-fg-secondary">{grant.rejectionReason ?? 'This grant listing was not approved.'}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-xl border border-border/80 shadow-xs bg-surface p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
                  <Landmark className="size-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-fg tracking-tight leading-snug">{grant.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone="neutral">{grant.providerType}</Badge>
                    {isExpired && <Badge tone="danger">Deadline passed</Badge>}
                  </div>
                </div>
              </div>
              {grant.canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/grants/${grant.id}/edit`}>
                    <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />}>
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger-subtle"
                    size="sm"
                    leftIcon={<Trash2 className="size-3.5" />}
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm text-fg-muted font-medium mb-3">{grant.provider}</p>

            {grant.description && <p className="text-sm sm:text-base text-fg-secondary leading-relaxed whitespace-pre-line">{grant.description}</p>}

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-5 border-t border-border/60 text-sm">
              {grant.fundingAmount && (
                <span className="flex items-center gap-1.5 font-semibold text-fg-secondary">
                  <IndianRupee className="size-3.5" /> {grant.fundingAmount}
                </span>
              )}
              {grant.deadline && (
                <span className="flex items-center gap-1.5 font-semibold text-fg-secondary">
                  <CalendarClock className="size-3.5" /> Apply by {new Date(grant.deadline).toLocaleDateString()}
                </span>
              )}
              {!grant.deadline && <span className="text-fg-muted">Rolling — no fixed deadline</span>}
            </div>

            {grant.eligibilityCriteria && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Eligibility</p>
                <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">{grant.eligibilityCriteria}</p>
              </div>
            )}

            {grant.eligibleStages.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Eligible stages</p>
                <div className="flex flex-wrap gap-1.5">
                  {grant.eligibleStages.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {grant.eligibleSectors.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">Eligible sectors</p>
                <div className="flex flex-wrap gap-1.5">
                  {grant.eligibleSectors.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-border/60">
              <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer">
                <Button leftIcon={<ExternalLink className="size-4" />}>Apply on {grant.provider}'s site</Button>
              </a>
              <p className="text-xs text-fg-muted mt-2">Applications are handled entirely by {grant.provider} — BuildAdda just points you there.</p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Remove this grant?"
        description={`"${grant.name}" will be removed from the directory for everyone. This can't be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Remove grant
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">This action is permanent.</p>
      </Modal>
    </div>
  )
}
