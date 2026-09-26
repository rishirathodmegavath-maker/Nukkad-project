import { Link } from 'react-router-dom'
import { Briefcase, Calendar, Lightbulb, Rocket, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

interface Action {
  label: string
  icon: LucideIcon
  tone: string
  to?: string
  onClick?: () => void
}

function ActionButton({ action }: { action: Action }) {
  const Icon = action.icon
  const content = (
    <>
      <span className={cn('flex size-8 items-center justify-center rounded-lg', action.tone)}>
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-semibold text-fg text-center leading-tight">{action.label}</span>
    </>
  )
  const className =
    'flex flex-col items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-2 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover cursor-pointer'

  return action.to ? (
    <Link to={action.to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  )
}

/**
 * The chapter detail page's right-sidebar shortcut grid — each button drives a real, already-existing
 * create flow (never a placeholder): Create Event and Post Opportunity/Add Startup self-derive the
 * signed-in member's own chapter server-side, so they only make sense for a member of THIS chapter
 * (the caller gates the whole card on that). Create Event stays president-only, same as the Events
 * tab's own gate.
 */
export function QuickActionsCard({
  chapterId,
  canManageEvents,
  onShareIdea,
}: {
  chapterId: string
  canManageEvents: boolean
  onShareIdea: () => void
}) {
  const actions: Action[] = [
    ...(canManageEvents
      ? [{ label: 'Create Event', icon: Calendar as LucideIcon, tone: 'bg-sky-500/10 text-sky-600', to: `/events/new?chapterId=${chapterId}` }]
      : []),
    { label: 'Post Opportunity', icon: Briefcase, tone: 'bg-blue-500/10 text-blue-600', to: '/opportunities/new' },
    { label: 'Share Idea', icon: Lightbulb, tone: 'bg-amber-500/10 text-amber-600', onClick: onShareIdea },
    { label: 'Add Startup', icon: Rocket, tone: 'bg-emerald-500/10 text-emerald-600', to: '/startups/new' },
  ]

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-fg">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </div>
    </Card>
  )
}
