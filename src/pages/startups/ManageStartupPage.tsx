import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ExternalLink, ShieldAlert } from 'lucide-react'
import { getMyStartupMembership, getStartup, getStartupJoinRequests, getStartupMembers } from '@/services/startups.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { StartupMaterialsSection } from '@/components/domain/StartupMaterialsSection'
import { StartupTeamTab } from '@/components/startup/StartupTeamTab'
import { BasicInfoSection } from '@/components/startup/manage/BasicInfoSection'
import { DeleteSection } from '@/components/startup/manage/DeleteSection'
import { FundraisingSection } from '@/components/startup/manage/FundraisingSection'
import { ManageEventsSection } from '@/components/startup/manage/ManageEventsSection'
import { StorySection } from '@/components/startup/manage/StorySection'
import { TractionSection } from '@/components/startup/manage/TractionSection'
import { VisibilitySection } from '@/components/startup/manage/VisibilitySection'
import { MANAGE_SECTIONS, isSectionKey, type SectionKey } from '@/components/startup/manage/manage-model'
import { cn } from '@/lib/utils'

/**
 * Everything a founder or admin can change about a startup, one section at a time: basic information, problem and
 * solution, traction, fundraising, materials, team, visibility, and (founders only) deletion. Each section saves on
 * its own. The server decides who may do what on every request; this page only offers what it will allow.
 */
export default function ManageStartupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const panelRef = useRef<HTMLDivElement>(null)
  const [dirty, setDirty] = useState<Partial<Record<SectionKey, boolean>>>({})
  const [leaveOpen, setLeaveOpen] = useState(false)

  const sectionParam = searchParams.get('section')
  const section: SectionKey = isSectionKey(sectionParam) ? sectionParam : 'basics'
  function selectSection(key: SectionKey) {
    setSearchParams(key === 'basics' ? {} : { section: key }, { replace: true })
    panelRef.current?.focus({ preventScroll: true })
  }

  const startupQuery = useQuery({
    queryKey: ['startup', id],
    queryFn: async () => {
      const found = await getStartup(id!)
      if (!found) throw new Error('Startup not found')
      return found
    },
    enabled: !!id,
  })
  const membershipQuery = useQuery({
    queryKey: ['startup', id, 'my-membership'],
    queryFn: async () => (await getMyStartupMembership(id!)) ?? null,
    enabled: !!id,
  })
  const isFounder = membershipQuery.data?.isFounder ?? false
  const canManage = membershipQuery.data?.canManage ?? false
  const membersQuery = useQuery({
    queryKey: ['startup', id, 'members'],
    queryFn: () => getStartupMembers(id!),
    enabled: !!id && canManage,
  })
  const requestsQuery = useQuery({
    queryKey: ['startup', id, 'join-requests'],
    queryFn: () => getStartupJoinRequests(id!),
    enabled: !!id && canManage,
  })

  // Each section tells the page whether it has unsaved changes, so the navigation can show it and leaving can warn.
  const report = useCallback((key: SectionKey, value: boolean) => {
    setDirty((prev) => (!!prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])
  const dirtyHandlers = useMemo(
    () => Object.fromEntries(MANAGE_SECTIONS.map((s) => [s.key, (value: boolean) => report(s.key, value)])) as Record<SectionKey, (value: boolean) => void>,
    [report],
  )
  const anyDirty = Object.values(dirty).some(Boolean)

  // Refreshing or closing the tab would lose the changes, so the browser asks first.
  useEffect(() => {
    if (!anyDirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [anyDirty])

  // On a phone the sections scroll sideways; keep the chosen one in view so it is clear where you are.
  const ready = !!startupQuery.data && canManage
  useEffect(() => {
    if (!ready) return
    document.querySelector('nav[aria-label="Manage startup sections"] [aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [section, ready])

  if (startupQuery.isLoading || (membershipQuery.isLoading && !membershipQuery.data)) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }
  if (startupQuery.isError || !startupQuery.data) {
    return <ErrorState title="Couldn’t load this startup" onRetry={() => startupQuery.refetch()} />
  }

  const startup = startupQuery.data
  const profilePath = `/startups/${startup.id}`

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState
          as="h2"
          icon={<ShieldAlert className="size-5" />}
          title="You can’t manage this startup"
          description="Only the founders and admins of a startup can manage it. If you think you should have access, ask a founder to make you an admin."
          action={
            <Link to={profilePath} className={buttonClasses({ variant: 'primary' })}>
              Back to {startup.name}
            </Link>
          }
        />
      </Card>
    )
  }

  const pendingRequests = requestsQuery.data ?? []
  const active = MANAGE_SECTIONS.find((s) => s.key === section)!

  function handleBack(e: MouseEvent) {
    if (!anyDirty) return
    e.preventDefault()
    setLeaveOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/startups" className="transition-colors hover:text-fg">
          Startups
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        <Link to={profilePath} onClick={handleBack} className="max-w-[12rem] truncate transition-colors hover:text-fg">
          {startup.name}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-fg">Manage</span>
      </nav>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <EntityLogo src={startup.logoUrl} name={startup.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-fg [overflow-wrap:anywhere]">Manage {startup.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone={isFounder ? 'primary' : 'info'}>{isFounder ? 'You’re a founder' : 'You’re an admin'}</Badge>
              <Badge tone="neutral">{startup.visibility === 'Public' ? 'Public' : 'Members only'}</Badge>
              {startup.isRaising && startup.fundraisingVisible && (
                <Badge tone="accent" dot>
                  Raising now
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Link to={profilePath} onClick={handleBack} className={buttonClasses({ variant: 'secondary', className: 'shrink-0 whitespace-nowrap' })}>
          <ExternalLink className="size-4" aria-hidden="true" />
          View profile
        </Link>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Manage startup sections" className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0 lg:sticky lg:top-20 lg:overflow-visible">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {MANAGE_SECTIONS.filter((s) => s.key !== 'delete' || isFounder).map((s) => {
              const Icon = s.icon
              const selected = s.key === section
              const isDelete = s.key === 'delete'
              return (
                <li key={s.key} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => selectSection(s.key)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:whitespace-normal',
                      selected
                        ? isDelete
                          ? 'border-danger-500/40 bg-danger-500/10 text-danger-500'
                          : 'border-brand-500/40 bg-brand-500/10 text-fg-brand'
                        : isDelete
                          ? 'border-transparent text-danger-500 hover:bg-danger-500/5'
                          : 'border-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block">{s.label}</span>
                      <span className="mt-0.5 hidden text-xs font-normal text-fg-muted lg:block">{s.hint}</span>
                    </span>
                    {s.key === 'team' && pendingRequests.length > 0 && (
                      <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold leading-none text-fg-brand" title="Join requests waiting">
                        {pendingRequests.length}
                        <span className="sr-only"> join requests waiting</span>
                      </span>
                    )}
                    {dirty[s.key] && (
                      <span className="size-2 shrink-0 rounded-full bg-warning-500" title="Unsaved changes">
                        <span className="sr-only">Unsaved changes</span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div ref={panelRef} tabIndex={-1} aria-label={active.label} className="min-w-0 outline-none">
          <div hidden={section !== 'basics'}>
            <BasicInfoSection startup={startup} onDirtyChange={dirtyHandlers.basics} />
          </div>
          <div hidden={section !== 'story'}>
            <StorySection startup={startup} onDirtyChange={dirtyHandlers.story} />
          </div>
          <div hidden={section !== 'traction'}>
            <TractionSection startup={startup} onDirtyChange={dirtyHandlers.traction} />
          </div>
          <div hidden={section !== 'fundraising'}>
            <FundraisingSection startup={startup} onDirtyChange={dirtyHandlers.fundraising} onGo={selectSection} />
          </div>
          {section === 'materials' && <StartupMaterialsSection startupId={startup.id} canManage />}
          {section === 'events' && <ManageEventsSection startup={startup} />}
          {section === 'team' && (
            <StartupTeamTab
              startup={startup}
              members={membersQuery.data}
              membersLoading={membersQuery.isLoading}
              canManage
              isFounder={isFounder}
              membership={membershipQuery.data ?? undefined}
              pendingRequests={pendingRequests}
            />
          )}
          <div hidden={section !== 'visibility'}>
            <VisibilitySection startup={startup} onDirtyChange={dirtyHandlers.visibility} />
          </div>
          {section === 'delete' && <DeleteSection startup={startup} isFounder={isFounder} />}
        </div>
      </div>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave without saving?"
        description="You have changes that haven’t been saved. If you leave now, they’re lost."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => navigate(profilePath)}>
              Discard and leave
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Sections you’ve already saved are not affected.</p>
      </Modal>
    </div>
  )
}
