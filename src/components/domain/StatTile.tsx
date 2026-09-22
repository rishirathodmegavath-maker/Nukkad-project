import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string | number
}

export function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <Card padding="sm" className="flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500/10 text-fg-brand border border-brand-500/20 shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-fg tracking-tight leading-tight">{value}</p>
        <p className="text-xs font-medium text-fg-muted truncate mt-0.5">{label}</p>
      </div>
    </Card>
  )
}

