import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { KeyRound, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Toaster } from '@/components/ui/Toaster'
import { adminLogout } from '@/services/admin-auth.service'
import { getStoredSession } from '@/lib/session'
import { AdminChangePasswordModal } from '@/pages/admin/AdminChangePasswordModal'

/** Bare-bones frame for the admin portal: no member navigation, search, notifications or messenger —
 *  administrators operate the platform, they don't use it. */
export function AdminPortalShell() {
  const navigate = useNavigate()
  const adminName = getStoredSession()?.name
  const [changingPassword, setChangingPassword] = useState(false)

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
            <span className="rounded-md bg-brand-600/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {adminName && <span className="hidden sm:block text-sm text-fg-muted">{adminName}</span>}
            <Button variant="ghost" size="sm" leftIcon={<KeyRound className="size-4" />} onClick={() => setChangingPassword(true)}>
              Change password
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<LogOut className="size-4" />} onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] w-full mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
      <AdminChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
      <Toaster />
    </div>
  )
}
