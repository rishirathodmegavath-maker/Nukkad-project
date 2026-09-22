import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { requestAdminPasswordReset } from '@/services/admin-auth.service'
import { AdminPasswordResetGatePage } from './AdminPasswordResetGate'
import { useAdminPasswordResetGate } from '@/hooks/useAdminPasswordResetGate'

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const gate = useAdminPasswordResetGate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Enter your admin email.')
      return
    }
    setIsLoading(true)
    try {
      await requestAdminPasswordReset(email.trim())
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  if (gate !== 'enabled') return <AdminPasswordResetGatePage loading={gate === 'loading'} />

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <Logo size="md" />
          <span className="text-xl font-bold tracking-tight text-fg">BuildAdda</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
          {submitted ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MailCheck className="size-5 text-fg-brand" />
                <h1 className="text-lg font-bold text-fg tracking-tight">Check your email</h1>
              </div>
              {/* Deliberately not "we sent an email to X": the server gives the same answer for any
                  address, so claiming a send would be false for non-admin emails. */}
              <p className="text-sm text-fg-muted">
                If <span className="font-medium text-fg">{email.trim()}</span> belongs to an administrator, a reset
                link is on its way. It expires in 30 minutes and works once.
              </p>
              <p className="text-xs text-fg-muted">Nothing arrived? Check spam, or request another link — only the newest one works.</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-fg tracking-tight mb-1">Forgot your password?</h1>
              <p className="text-sm text-fg-muted mb-5">Enter your admin email and we'll send you a link to set a new one.</p>
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
                {error && (
                  <p role="alert" className="text-sm text-danger-500 -mt-2">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" isLoading={isLoading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          to="/login"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
