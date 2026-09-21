import { useState } from 'react'
import { Home, Rss, Bell, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'

const PREVIEW_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
]

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home, active: true },
  { key: 'feed', label: 'Feed', icon: Rss, active: false },
]

/** Built from the same shared components and tokens as the real app — not a disconnected mockup. */
export function LivePreviewPanel() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex h-9 items-center gap-2 px-3 bg-header border-b border-border">
        <span className="size-2.5 rounded-full bg-danger-500/60" />
        <span className="size-2.5 rounded-full bg-warning-500/60" />
        <span className="size-2.5 rounded-full bg-success-500/60" />
        <span className="ml-2 text-xs text-fg-muted">BuildAdda preview</span>
      </div>

      <div className="flex bg-canvas">
        <div className="w-20 shrink-0 bg-nav border-r border-border p-1.5 flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon, active }) => (
            <span
              key={key}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs font-medium truncate',
                active ? 'bg-nav-active text-nav-fg-active' : 'text-nav-fg',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0 p-3 flex flex-col gap-3">
          <Tabs items={PREVIEW_TABS} value={tab} onChange={setTab} />

          <Card padding="sm">
            <p className="text-xs font-semibold text-fg mb-1">Example card</p>
            <p className="text-xs text-fg-secondary mb-2">
              This is example content styled with your chosen theme, including a{' '}
              <span className="text-fg-brand font-medium cursor-pointer hover:underline">link</span>.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge tone="success">Accepted</Badge>
              <Badge tone="warning">Pending</Badge>
              <Badge tone="danger">Rejected</Badge>
              <Badge tone="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary">
                Primary
              </Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
            </div>
          </Card>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-brand-600 shrink-0">
              <Bell className="size-3" />
            </span>
            <p className="text-xs text-fg flex-1 min-w-0 truncate">
              <span className="font-medium">Someone</span> liked your post <Heart className="inline size-3 text-danger-500 align-[-1px]" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
