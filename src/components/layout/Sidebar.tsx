import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { X, PanelLeftClose, PanelLeftOpen, ArrowRight, UserPlus } from 'lucide-react'
import { navSections } from './nav-config'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { IconButton } from '@/components/ui/IconButton'
import { InviteBuilderModal } from '@/components/domain/InviteBuilderModal'

function NavSectionItems({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  // The admin panel is a separate site (admin.…), so it never appears in the member navigation.
  const sections = navSections

  return (
    <div className={cn('flex flex-col gap-5 py-2 [@media(max-height:900px)]:gap-3', collapsed ? 'px-2 items-center' : 'px-3')}>
      {sections.map((section) => (
        <div key={section.title} className={cn('flex flex-col gap-1', collapsed ? 'items-center w-full' : '')}>
          {!collapsed && (
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-fg-muted/80">
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
                    'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'size-10 justify-center' : 'gap-3 px-3 py-2.5 [@media(max-height:900px)]:py-2',
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
                          'absolute rounded-r-full bg-fg-brand',
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

/**
 * The foot of the sidebar: invite someone to BuildAdda. A full card when the screen is tall enough, a single button when it
 * is not (or in the phone menu, via `compactOnly`), so it never crowds out the navigation. Just an icon when collapsed.
 */
function InviteCard({ collapsed, compactOnly }: { collapsed?: boolean; compactOnly?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {collapsed ? (
        <div className="flex justify-center px-2 pb-3">
          <IconButton label="Invite a builder" onClick={() => setOpen(true)}>
            <UserPlus className="size-[18px]" />
          </IconButton>
        </div>
      ) : (
        <div className="px-3 pb-4">
          {!compactOnly && (
            <div className="hidden rounded-xl border border-brand-500/20 bg-brand-500/10 p-4 [@media(min-height:821px)]:block">
              <p className="text-base font-bold leading-snug text-fg">
                Build together.
                <br />
                Go further.
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">Join India’s growing startup community.</p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 cursor-pointer"
              >
                Invite a Builder
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 cursor-pointer',
              !compactOnly && '[@media(min-height:821px)]:hidden',
            )}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Invite a Builder
          </button>
        </div>
      )}
      <InviteBuilderModal open={open} onClose={() => setOpen(false)} />
    </>
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
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-5',
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 min-w-0 rounded-lg transition-opacity hover:opacity-80" aria-label="Go to home">
          <Logo size="sm" />
          {!collapsed && (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-lg font-bold text-fg tracking-tight truncate">BuildAdda</span>
                <span className="text-xs font-medium text-fg-muted truncate">Where builders meet.</span>
              </span>
            </span>
          )}
        </Link>
        {/* The toggle sits with the brand, next to the navigation it controls, not stranded at the bottom. */}
        {!collapsed && (
          <IconButton label="Collapse sidebar" aria-expanded={true} onClick={toggleSidebar}>
            <PanelLeftClose className="size-[18px]" />
          </IconButton>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3">
        {collapsed && (
          <div className="flex justify-center pb-2">
            <IconButton label="Expand sidebar" aria-expanded={false} onClick={toggleSidebar}>
              <PanelLeftOpen className="size-[18px]" />
            </IconButton>
          </div>
        )}
        <NavSectionItems collapsed={collapsed} />
      </div>

      <InviteCard collapsed={collapsed} />
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
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-fg tracking-tight">BuildAdda</span>
              <span className="text-xs font-medium text-fg-muted">Where builders meet.</span>
            </span>
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
        <InviteCard compactOnly />
      </div>
    </div>
  )
}

