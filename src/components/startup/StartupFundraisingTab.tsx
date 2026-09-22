import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Landmark } from 'lucide-react'
import { getFundraiseByStartup } from '@/services/investors.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { SectionKey } from '@/components/startup/manage/manage-model'
import { Field, RichText } from '@/components/startup/ProfileParts'
import { formatCurrency } from '@/lib/utils'
import type { Startup } from '@/types'

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" variant="sunken" className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-fg" title={`₹${value.toLocaleString('en-IN')}`}>
        {formatCurrency(value)}
      </p>
    </Card>
  )
}

/**
 * The startup's fundraise. What the server returns is exactly what the viewer may see: when the founders have hidden
 * fundraising, a visitor gets nothing back and sees the same "no information" state as for a startup that isn't raising.
 */
export function StartupFundraisingTab({ startup, canManage, onManage }: { startup: Startup; canManage: boolean; onManage: (section: SectionKey) => void }) {
  const query = useQuery({
    queryKey: ['fundraise', 'by-startup', startup.id],
    // No fundraise (or none this viewer may see) is null, an answer in its own right; a query can't resolve to undefined.
    queryFn: async () => (await getFundraiseByStartup(startup.id)) ?? null,
  })

  if (query.isLoading) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }
  if (query.isError) return <ErrorState title="Couldn’t load fundraising" onRetry={() => query.refetch()} />

  const fundraise = query.data
  if (!fundraise) {
    return (
      <EmptyState
        as="h3"
        className="py-12"
        icon={<Landmark className="size-5" />}
        title={canManage ? 'Not raising yet' : 'No fundraising information'}
        description={
          canManage
            ? 'Starting a fundraise marks this startup as raising and makes it discoverable to investors.'
            : 'This startup hasn’t shared any fundraising details.'
        }
        action={
          canManage && startup.moderationStatus !== 'REJECTED' ? (
            <Button size="sm" onClick={() => onManage('fundraising')}>
              Start a fundraise
            </Button>
          ) : undefined
        }
      />
    )
  }

  const percent = fundraise.targetAmount > 0 ? Math.min(100, (fundraise.amountRaised / fundraise.targetAmount) * 100) : 0

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {canManage && !startup.fundraisingVisible && (
        <Card padding="sm" className="flex items-start gap-3 border-brand-500/30 bg-brand-500/5 shadow-none">
          <Eye className="mt-0.5 size-4 shrink-0 text-fg-brand" aria-hidden="true" />
          <p className="text-sm text-fg-secondary">
            Fundraising is hidden from everyone outside your team.{' '}
            <button type="button" onClick={() => onManage('visibility')} className="cursor-pointer font-semibold text-fg-brand hover:underline">
              Change fundraising visibility
            </button>{' '}
            to show it to investors and members.
          </p>
        </Card>
      )}

      <SectionCard
        title="Current round"
        icon={<Landmark className="size-4" />}
        action={
          <div className="flex items-center gap-1.5">
            <Badge tone="primary">{fundraise.fundingStage}</Badge>
            <Badge tone={fundraise.status === 'Open' ? 'success' : 'neutral'}>{fundraise.status}</Badge>
          </div>
        }
      >
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-fg">{Math.round(percent)}% raised</p>
          <p className="text-sm text-fg-muted">
            {formatCurrency(fundraise.amountRaised)} of {formatCurrency(fundraise.targetAmount)}
          </p>
        </div>
        <ProgressBar value={percent} label="Amount raised" tone="success" className="mb-4" />

        <div className="grid gap-3 sm:grid-cols-3">
          <Amount label="Target" value={fundraise.targetAmount} />
          <Amount label="Raised" value={fundraise.amountRaised} />
          {fundraise.minimumTicket != null && fundraise.minimumTicket > 0 && <Amount label="Minimum ticket" value={fundraise.minimumTicket} />}
        </div>

        {fundraise.useOfFunds?.trim() && (
          <Field label="Use of funds" className="mt-5">
            <RichText className="text-[15px]">{fundraise.useOfFunds.trim()}</RichText>
          </Field>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          {canManage && (
            <Button variant="secondary" onClick={() => onManage('fundraising')}>
              Manage fundraising
            </Button>
          )}
          <Link to={`/investors/fundraises/${fundraise.id}`} className={buttonClasses({ variant: canManage ? 'ghost' : 'secondary' })}>
            View fundraise details
          </Link>
          {canManage && (
            <Link to="/investors" className={buttonClasses({ variant: 'soft' })}>
              Find investors
            </Link>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
