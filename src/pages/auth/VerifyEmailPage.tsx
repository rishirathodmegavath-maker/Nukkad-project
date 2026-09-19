import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Mail } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { verifyEmail, resendVerificationEmail } from '@/services/auth.service'
import { toast } from '@/store/toast.store'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error')
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (!token) return
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  async function handleResend(e: FormEvent) {
    e.preventDefault()
    setIsResending(true)
    try {
      await resendVerificationEmail(resendEmail)
      toast.success('If that email exists and isn’t verified yet, a new link was sent.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirming your Buildadda account."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      {status === 'loading' && <p className="text-sm text-fg-muted text-center py-6">Verifying your email…</p>}

      {status === 'success' && (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CheckCircle2 className="size-10 text-success-500" />
          <p className="text-sm text-fg">Your email is verified. You can now log in to Buildadda.</p>
          <Link to="/login">
            <Button size="sm">Go to log in</Button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center text-center gap-4 py-6">
          <XCircle className="size-10 text-danger-500" />
          <p className="text-sm text-fg">
            This verification link is invalid or has expired. Request a new one below.
          </p>
          <form onSubmit={handleResend} className="flex flex-col gap-3 w-full">
            <Input
              label="Email"
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              leftIcon={<Mail className="size-4" />}
              placeholder="you@example.com"
            />
            <Button type="submit" isLoading={isResending} className="w-full">
              Resend verification email
            </Button>
          </form>
        </div>
      )}
    </AuthLayout>
  )
}
