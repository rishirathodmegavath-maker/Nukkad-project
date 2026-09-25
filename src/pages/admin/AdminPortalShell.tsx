import { Suspense, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/DropdownMenu'
import { Toaster } from '@/components/ui/Toaster'
import { adminLogout, getAdminIdentity } from '@/services/admin-auth.service'
import { getStoredSession } from '@/lib/session'
import { AdminChangePasswordModal } from '@/pages/admin/AdminChangePasswordModal'

/** Bare-bones frame for the admin portal: no member navigation, search, notifications or messenger —
 *  administrators operate the platform, they don't use it. */
export function AdminPortalShell() {
  const navigate = useNavigate()
  const [changingPassword, setChangingPassword] = useState(false)

  // The name in the stored session is from sign-in time and it never had the email, so ask the server.
  const { data: identity } = useQuery({ queryKey: ['admin', 'me'], queryFn: getAdminIdentity, staleTime: 5 * 60_000 })
  const name = identity?.name || getStoredSession()?.name || 'Administrator'
  const email = identity?.email

  async function signOut() {
    await adminLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border/70 bg-surface">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="text-base font-bold tracking-tight text-fg">BuildAdda</span>
            <span className="rounded-md bg-brand-600/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-fg-brand">
              Admin
            </span>
          </div>

          <DropdownMenu
            trigger={
              <button
                type="button"
                aria-label={`Account menu for ${name}`}
                aria-haspopup="menu"
                className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-fg transition-colors hover:bg-surface-hover sm:pr-3"
              >
                <Avatar name={name} size="sm" />
                <span className="hidden max-w-[10rem] truncate sm:block">{name}</span>
                <ChevronDown className="size-4 text-fg-muted" aria-hidden="true" />
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-border/60 mb-1 bg-surface-sunken/40">
              <p className="text-sm font-bold text-fg truncate">{name}</p>
              {email && (
                <p className="text-xs text-fg-muted truncate mt-0.5" title={email}>
                  {email}
                </p>
              )}
              <span className="mt-2 inline-block rounded-md bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-fg-brand">
                Administrator
              </span>
            </div>
            <DropdownItem icon={<KeyRound className="size-4" />} onClick={() => setChangingPassword(true)}>
              Change password
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<LogOut className="size-4 text-danger-500" />} danger onClick={signOut}>
              Sign out
            </DropdownItem>
          </DropdownMenu>
        </div>
      </header>
      <main className="max-w-[1400px] w-full mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <AdminChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
      <Toaster />
    </div>
  )
}
