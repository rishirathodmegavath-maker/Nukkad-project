import { NavLink, Link } from 'react-router-dom'
import { ShieldCheck, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { navSections } from './nav-config'
import { useUiStore } from '@/store/ui.store'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const ADMIN_SECTION = {
  title: 'Admin',
  items: [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck, end: false }],
}

function NavSectionItems({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { data: currentUser } = useCurrentUser()
  // UX only — hides the entry point for non-admins. The backend independently rejects every
  // /api/admin/** call with 403 for anyone without ROLE_ADMIN, regardless of what nav renders.
  const isAdmin = !!currentUser?.roles.includes('ADMIN')
  const sections = isAdmin ? [...navSections, ADMIN_SECTION] : navSections

  return (
    <div className={cn('flex flex-col gap-5 py-2', collapsed ? 'px-2 items-center' : 'px-3')}>
      {sections.map((section) => (
        <div key={section.title} className={cn('flex flex-col gap-1', collapsed ? 'items-center w-full' : '')}>
          {!collapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-fg-muted/80">
              {section.title}
            </p>
          )}
          {collapsed && <div className="w-5 h-px bg-border/60 my-1" />}
          <div className={cn('flex flex-col gap-0.5 mt-0.5', collapsed ? 'items-center w-full' : '')}>
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                    collapsed ? 'size-10 justify-center' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-nav-active text-nav-fg-active font-semibold shadow-2xs'
                      : 'text-nav-fg hover:bg-surface-hover hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'size-[18px] shrink-0 transition-transform group-hover:scale-105',
                        isActive
                          ? 'text-nav-fg-active'
                          : 'text-nav-fg group-hover:text-fg',
                      )}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {isActive && (
                      <span
                        className={cn(
                          'absolute rounded-r-full bg-brand-600 dark:bg-brand-400',
                          collapsed ? 'left-0 top-1.5 bottom-1.5 w-1' : 'left-0 top-2 bottom-2 w-1',
                        )}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DesktopSidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col shrink-0 h-screen sticky top-0 bg-nav border-r border-border/80 z-20 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[256px]',
      )}
    >
      <div
        className={cn(
          'flex items-center h-16 shrink-0 border-b border-border/60 transition-all',
          collapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 min-w-0 rounded-lg transition-opacity hover:opacity-80" aria-label="Go to home">
          <Logo size="sm" />
          {!collapsed && (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-lg font-bold text-fg tracking-tight truncate">Buildadda</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <NavSectionItems collapsed={collapsed} />
      </div>

      <div className="p-2 border-t border-border/60 shrink-0 flex items-center justify-center">
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center gap-2 rounded-xl text-xs font-medium text-fg-secondary hover:text-fg hover:bg-surface-hover transition-colors cursor-pointer',
            collapsed ? 'size-10 justify-center' : 'w-full px-3 py-2 justify-between',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 text-fg-muted" />
          ) : (
            <>
              <span className="text-fg-muted">Collapse sidebar</span>
              <PanelLeftClose className="size-4 text-fg-muted" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export function MobileDrawer() {
  const open = useUiStore((s) => s.mobileNavOpen)
  const setOpen = useUiStore((s) => s.setMobileNavOpen)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-xs animate-in" onClick={() => setOpen(false)} />
      <div className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-surface border-r border-border shadow-2xl animate-in">
        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-border/60">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
            aria-label="Go to home"
          >
            <Logo size="sm" />
            <span className="text-lg font-bold text-fg tracking-tight">Buildadda</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-fg-muted hover:text-fg hover:bg-surface-hover rounded-lg p-1.5 cursor-pointer transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavSectionItems onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </div>
  )
}

