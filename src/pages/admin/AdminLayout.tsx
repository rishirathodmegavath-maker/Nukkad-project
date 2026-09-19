import { NavLink, Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/activity', label: 'Activity', end: false },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/startups', label: 'Startups', end: false },
  { to: '/admin/ideas', label: 'Ideas', end: false },
  { to: '/admin/opportunities', label: 'Opportunities', end: false },
  { to: '/admin/grants', label: 'Grants', end: false },
  { to: '/admin/feed', label: 'Feed', end: false },
  { to: '/admin/investor-activations', label: 'Investor Applications', end: false },
  { to: '/admin/reports', label: 'Reports', end: false },
  { to: '/admin/withdrawals', label: 'Withdrawals', end: false },
  { to: '/admin/audit-logs', label: 'Audit Logs', end: false },
]

export default function AdminLayout() {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <ShieldCheck className="size-5 text-brand-600 dark:text-brand-400" />
        <h1 className="text-2xl font-bold text-fg tracking-tight">Control panel</h1>
      </div>
      <p className="text-sm text-fg-muted mb-6 max-w-2xl">
        Platform administration — every action here is authorized and recorded in the audit log. Private
        messages are never visible here.
      </p>

      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto no-scrollbar mb-6">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-fg-muted hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full bg-brand-600 dark:bg-brand-500 shadow-xs" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
