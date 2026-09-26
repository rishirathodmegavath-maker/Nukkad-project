import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

/** Thirteen sections do not fit in one row, so they are grouped by what an admin is doing:
 *  a sidebar from lg up, a scrolling strip below it. */
const ADMIN_NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', end: true },
      { to: '/admin/activity', label: 'Activity' },
    ],
  },
  {
    heading: 'People',
    items: [
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/investor-activations', label: 'Investor Applications' },
    ],
  },
  {
    heading: 'Investors',
    items: [
      { to: '/admin/investor-catalog', label: 'Investor Catalog' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/admin/startups', label: 'Startups' },
      { to: '/admin/ideas', label: 'Ideas' },
      { to: '/admin/opportunities', label: 'Opportunities' },
      { to: '/admin/grants', label: 'Grants' },
      { to: '/admin/resources', label: 'Resources' },
      { to: '/admin/chapters', label: 'Chapters' },
      { to: '/admin/program-applications', label: 'Program Applications' },
      { to: '/admin/feed', label: 'Feed' },
    ],
  },
  {
    heading: 'Trust and money',
    items: [
      { to: '/admin/reports', label: 'Reports' },
      { to: '/admin/withdrawals', label: 'Withdrawals' },
      { to: '/admin/audit-logs', label: 'Audit Logs' },
    ],
  },
]

export default function AdminLayout() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-fg">Control panel</h1>
      <p className="mb-6 max-w-2xl text-sm text-fg-muted">
        Platform administration — every action here is authorized and recorded in the audit log. Private
        messages are never visible here.
      </p>

      <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <nav aria-label="Admin sections" className="mb-6 lg:sticky lg:top-6 lg:-ml-3 lg:mb-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
          {/* Below lg this is a horizontal strip. It deliberately keeps its scrollbar: hiding it would make
              the tabs past the edge look cut off with no hint that they can be reached. */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/80 lg:flex-col lg:items-stretch lg:gap-5 lg:overflow-visible lg:border-b-0">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.heading} className="flex items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5">
                <p className="hidden px-3 pb-1 text-xs font-semibold text-fg-muted lg:block">{group.heading}</p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors',
                        'lg:rounded-lg lg:px-3 lg:py-2 lg:font-medium',
                        isActive ? 'text-fg-brand lg:bg-nav-active' : 'text-fg-muted hover:text-fg lg:hover:bg-surface-hover',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {item.label}
                        {isActive && (
                          <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-600 lg:hidden" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
