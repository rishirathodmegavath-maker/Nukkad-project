import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import { listUsers } from '@/services/users.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { CreateStartupDraft, TeamRoleChoice } from '@/components/startup/create/create-startup-model'

const ROLE_HELP: Record<TeamRoleChoice, string> = {
  MEMBER: 'Member: appears on the team and can post updates. Can’t edit the startup or post jobs.',
  ADMIN: 'Admin: can edit the startup, manage members and post jobs. Only you, as Founder, can delete it or change roles.',
}

interface StepTeamProps {
  draft: CreateStartupDraft
  onChange: (patch: Partial<CreateStartupDraft>) => void
}

/**
 * Step 5: the founder is the person creating the startup, automatically. Anyone else is found with the same people
 * search the team page uses and is added the moment the startup exists, through the same add-member call.
 */
export function StepTeam({ draft, onChange }: StepTeamProps) {
  const { data: me } = useCurrentUser()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [addAs, setAddAs] = useState<TeamRoleChoice>('MEMBER')

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const people = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => listUsers({ query: search || undefined }),
  })

  const staged = new Set(draft.teammates.map((t) => t.user.id))
  const candidates = (people.data ?? []).filter((u) => u.id !== me?.id && !staged.has(u.id))

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="csf-founder-heading">
        <h3 id="csf-founder-heading" className="mb-2 text-sm font-semibold text-fg">
          Founder
        </h3>
        <Card padding="sm" variant="sunken" className="flex min-w-0 items-center gap-3">
          {me ? <Avatar src={me.avatarUrl} name={me.name} size="md" /> : <Skeleton className="size-10 rounded-full" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{me?.name ?? 'You'}</p>
            {me?.headline && <p className="truncate text-xs text-fg-muted">{me.headline}</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="primary">Founder</Badge>
              <Badge tone="neutral">You</Badge>
            </div>
          </div>
        </Card>
        <p className="mt-2 text-xs text-fg-muted">You become the Founder automatically when the startup is created.</p>
      </section>

      <section aria-labelledby="csf-teammates-heading">
        <h3 id="csf-teammates-heading" className="mb-2 text-sm font-semibold text-fg">
          Teammates {draft.teammates.length > 0 && <span className="font-normal text-fg-muted">({draft.teammates.length})</span>}
        </h3>
        {draft.teammates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/90 bg-surface-sunken/40 px-4 py-5 text-center text-sm text-fg-muted">
            No teammates yet. Add them below, or later from your startup’s Team tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {draft.teammates.map((t) => (
              <li key={t.user.id}>
                <Card padding="sm" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2.5 shadow-2xs" data-testid="staged-teammate">
                  <Avatar src={t.user.avatarUrl} name={t.user.name} size="md" />
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="truncate text-sm font-semibold text-fg">{t.user.name}</p>
                    {t.user.headline && <p className="truncate text-xs text-fg-muted">{t.user.headline}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      aria-label={`Role for ${t.user.name}`}
                      value={t.role}
                      onChange={(e) => onChange({ teammates: draft.teammates.map((x) => (x.user.id === t.user.id ? { ...x, role: e.target.value as TeamRoleChoice } : x)) })}
                      className="py-1.5 text-xs"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${t.user.name}`}
                      leftIcon={<X className="size-3.5" />}
                      onClick={() => onChange({ teammates: draft.teammates.filter((x) => x.user.id !== t.user.id) })}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="csf-add-heading">
        <h3 id="csf-add-heading" className="mb-2 text-sm font-semibold text-fg">
          Add a teammate
        </h3>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
            <input
              id="csf-teammate-search"
              name="csf-teammate-search"
              type="search"
              aria-label="Search people by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // Enter must not submit the whole step from here.
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Search people by name…"
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3.5 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-brand-500 focus:shadow-focus"
            />
          </div>
          <div>
            <Select id="csf-add-as" label="Add as" value={addAs} onChange={(e) => setAddAs(e.target.value as TeamRoleChoice)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{ROLE_HELP[addAs]}</p>
          </div>

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto" aria-live="polite">
            {people.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : people.isError ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-danger-500/30 bg-danger-500/5 p-3 text-sm text-fg-secondary">
                <span>Couldn’t load people.</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => people.refetch()}>
                  Try again
                </Button>
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((u) => (
                <div key={u.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 p-2.5" data-testid="teammate-result">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{u.name}</p>
                      {u.headline && <p className="truncate text-xs text-fg-muted">{u.headline}</p>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<UserPlus className="size-3.5" />}
                    aria-label={`Add ${u.name} as ${addAs === 'ADMIN' ? 'Admin' : 'Member'}`}
                    onClick={() => onChange({ teammates: [...draft.teammates, { user: u, role: addAs }] })}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <p className="py-3 text-center text-sm text-fg-muted">{search ? 'No one matches that search.' : 'No one else to add yet.'}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-fg-muted">Teammates are added, and notified, as soon as your startup is created.</p>
      </section>
    </div>
  )
}
