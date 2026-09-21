import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Lock, ShieldAlert } from 'lucide-react'
import { PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { confirmAdminPasswordReset } from '@/services/admin-auth.service'
import { PASSWORD_REQUIREMENTS, isStrongPassword } from '@/lib/password'
import { AdminPasswordResetGatePage } from './AdminPasswordResetGate'
import { useAdminPasswordResetGate } from '@/hooks/useAdminPasswordResetGate'

/** The emailed link carries the token in the URL fragment (#token=…), which browsers never send to a
 *  server or in a Referer header — so it can't leak to the fonts host this page loads or to access logs. */
function readTokenFromHash(): string {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? ''
}

export default function AdminResetPasswordPage() {
  const [token] = useState(readTokenFromHash)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const gate = useAdminPasswordResetGate()

  // The token is a credential: once it's in memory, take it out of the address bar and history.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENTS)
      return
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      await confirmAdminPasswordReset(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // Once the reset itself has succeeded keep showing that, whatever the switch now says.
  if (!done && gate !== 'enabled') return <AdminPasswordResetGatePage loading={gate === 'loading'} />

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <Logo size="md" />
          <span className="text-xl font-bold tracking-tight text-fg">BuildAdda</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
          {done ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success-600 dark:text-success-400" />
                <h1 className="text-lg font-bold text-fg tracking-tight">Password updated</h1>
              </div>
              <p className="text-sm text-fg-muted">
                Every existing admin session was signed out. Sign in with your new password.
              </p>
              <Link to="/login" replace>
                <Button size="lg" className="w-full">
                  Go to sign in
                </Button>
              </Link>
            </div>
          ) : !token ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-danger-500" />
                <h1 className="text-lg font-bold text-fg tracking-tight">Reset link not valid</h1>
              </div>
              <p className="text-sm text-fg-muted">
                This link is missing its reset code. Open the link from the email exactly as sent, or request a new one.
              </p>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-fg tracking-tight mb-1">Set a new password</h1>
              <p className="text-sm text-fg-muted mb-5">Choose a new password for the admin control panel.</p>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="size-4" />}
                  hint={PASSWORD_REQUIREMENTS}
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="size-4" />}
                />
                {error && (
                  <p role="alert" className="text-sm text-danger-500 -mt-2">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" isLoading={isLoading}>
                  Update password
                </Button>
                <Link to="/forgot-password" className="text-center text-xs text-fg-muted hover:text-fg transition-colors">
                  Link expired? Request a new one
                </Link>
              </form>
            </>
          )}
        </div>

        {!done && (
          <Link
            to="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  )
}
