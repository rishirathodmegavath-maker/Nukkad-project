import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { adminLogin } from '@/services/admin-auth.service'
import { getStoredSession } from '@/lib/session'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  // Set by the change-password flow, which ends every session and sends the admin back here.
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (getStoredSession()) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.')
      return
    }
    setIsLoading(true)
    try {
      await adminLogin(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <Logo size="md" />
          <span className="text-xl font-bold tracking-tight text-fg">BuildAdda</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="size-5 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg font-bold text-fg tracking-tight">Admin control panel</h1>
          </div>
          <p className="text-sm text-fg-muted mb-5">Authorized administrators only. Every sign-in is recorded.</p>

          {notice && (
            <p role="status" className="mb-4 rounded-lg bg-success-100/50 px-3 py-2 text-sm text-fg">
              {notice}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Admin email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="size-4" />}
              placeholder="admin@example.com"
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="size-4" />}
              placeholder="Your password"
            />
            <Link
              to="/forgot-password"
              className="self-end -mt-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Forgot password?
            </Link>
            {error && (
              <p role="alert" className="text-sm text-danger-500 -mt-2">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" isLoading={isLoading}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
