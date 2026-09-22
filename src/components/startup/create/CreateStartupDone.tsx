import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { EntityLogo } from '@/components/ui/EntityLogo'
import type { Startup } from '@/types'
import type { TeamRoleChoice } from '@/components/startup/create/create-startup-model'

export interface CreateResult {
  startup: Startup
  logo: 'none' | 'uploaded' | { failed: string }
  team: { name: string; role: TeamRoleChoice; error?: string }[]
}

function Line({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Icon className={ok ? 'mt-0.5 size-4 shrink-0 text-success-500' : 'mt-0.5 size-4 shrink-0 text-warning-500'} aria-hidden="true" />
      <span className="min-w-0 text-fg-secondary [overflow-wrap:anywhere]">{children}</span>
    </li>
  )
}

/** Shown once the startup exists: what was created, and, honestly, anything that didn't go through and how to finish it. */
export function CreateStartupDone({ result }: { result: CreateResult }) {
  const { startup, logo, team } = result
  const failedTeam = team.filter((t) => t.error)

  return (
    <Card className="mx-auto max-w-2xl" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-center">
        <EntityLogo src={startup.logoUrl} name={startup.name} size="xl" />
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-fg">Your startup is live</h2>
          <p className="mt-1 text-sm text-fg-muted [overflow-wrap:anywhere]">
            <strong className="font-semibold text-fg">{startup.name}</strong> has been created and you’re its Founder.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge tone={startup.visibility === 'Public' ? 'success' : 'neutral'} size="md">
            {startup.visibility}
          </Badge>
          <Badge tone="neutral" size="md">
            Fundraising {startup.fundraisingVisible ? 'visible' : 'hidden'}
          </Badge>
        </div>
      </div>

      <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2.5" data-testid="create-summary">
        <Line ok>Startup created</Line>
        {logo === 'uploaded' && <Line ok>Logo uploaded</Line>}
        {typeof logo === 'object' && (
          <Line ok={false}>Your logo couldn’t be uploaded ({logo.failed}). Add it from the profile with the camera on the logo.</Line>
        )}
        {team.length > 0 && failedTeam.length === 0 && (
          <Line ok>
            {team.length} {team.length === 1 ? 'teammate' : 'teammates'} added and notified
          </Line>
        )}
        {failedTeam.map((t) => (
          <Line key={t.name} ok={false}>
            {t.name} couldn’t be added ({t.error}). Add them from the Team tab.
          </Line>
        ))}
      </ul>

      <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
        <Link to="/startups" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          Back to startups
        </Link>
        <Link to={`/startups/${startup.id}`} className={buttonClasses({ size: 'lg' })}>
          Open your startup
        </Link>
      </div>
    </Card>
  )
}
