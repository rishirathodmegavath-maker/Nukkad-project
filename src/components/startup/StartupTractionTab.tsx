import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { RichText } from '@/components/startup/ProfileParts'
import type { Startup } from '@/types'

/**
 * What the founders report about traction. The platform stores this as text they typed (revenue, customers, users,
 * growth and a free summary), not as a history, so it is shown as the figures they gave, never as a chart or trend.
 */
export function StartupTractionTab({ startup, canManage, onEdit }: { startup: Startup; canManage: boolean; onEdit: () => void }) {
  const metrics = [
    { label: 'Revenue', value: startup.revenue },
    { label: 'Customers', value: startup.customers },
    { label: 'Users', value: startup.users },
    { label: 'Growth', value: startup.growth },
  ].filter((m) => m.value.trim())
  // Older startups kept their traction in a single `traction` field before it was split up.
  const summary = (startup.otherTraction || startup.traction).trim()

  if (metrics.length === 0 && !summary) {
    return (
      <EmptyState
        as="h3"
        className="py-12"
        icon={<TrendingUp className="size-5" />}
        title="No traction shared yet"
        description={canManage ? 'Add revenue, customers, users or growth so investors and partners can see your progress.' : 'The founders haven’t shared any traction figures yet.'}
        action={
          canManage ? (
            <Button size="sm" onClick={onEdit}>
              Add traction
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} padding="sm" className="flex min-w-0 flex-col gap-1.5 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{m.label}</p>
              <p className="text-xl font-bold leading-snug tracking-tight text-fg [overflow-wrap:anywhere]">{m.value}</p>
            </Card>
          ))}
        </div>
      )}
      {summary && (
        <SectionCard title="Traction summary" description="In the founders’ own words." className="max-w-3xl">
          <RichText className="text-[15px]">{summary}</RichText>
        </SectionCard>
      )}
      <p className="text-xs text-fg-muted">These figures are reported by the founders and haven’t been independently verified.</p>
    </div>
  )
}
