import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GoogleSignInButton } from '@/components/domain/GoogleSignInButton'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import { resendVerificationEmail } from '@/services/auth.service'
import { ApiError } from '@/lib/api-client'

export interface GoogleLoginNotice {
  message: string
  action?: 'signup'
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [googleNotice] = useState<GoogleLoginNotice | null>(
    () => (location.state as { googleNotice?: GoogleLoginNotice } | null)?.googleNotice ?? null,
  )

  function goHome() {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    navigate(from, { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setShowResend(false)

    // Field-level checks before any API call — matches the pattern already used on Signup.
    const trimmedEmail = email.trim()
    let nextEmailError = ''
    let nextPasswordError = ''
    if (!trimmedEmail) {
      nextEmailError = 'Email is required.'
    } else if (!isValidEmailFormat(trimmedEmail)) {
      nextEmailError = 'Enter a valid email address.'
    }
    if (!password) {
      nextPasswordError = 'Password is required.'
    }
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return

    setIsLoading(true)
    try {
      await login({ email: trimmedEmail, password })
      toast.success('Welcome back!')
      goHome()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in.')
        setShowResend(true)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    try {
      await resendVerificationEmail(email)
      toast.success('Verification email sent again.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep building on Nukkad."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError('')
          }}
          leftIcon={<Mail className="size-4" />}
          placeholder="you@example.com"
          error={emailError || undefined}
        />
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="Password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError('')
            }}
            leftIcon={<Lock className="size-4" />}
            placeholder="Your password"
            error={passwordError || undefined}
          />
          <Link to="/forgot-password" className="self-end text-xs font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger-500 -mt-2">
            {error}
          </p>
        )}
        {showResend && (
          <Button type="button" variant="secondary" size="sm" isLoading={isResending} onClick={handleResend}>
            Resend verification email
          </Button>
        )}
        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Log in
        </Button>
        {googleNotice && (
          <div className="rounded-lg border border-border/80 bg-surface-sunken px-3 py-2.5 text-xs text-fg-secondary">
            <p>{googleNotice.message}</p>
            {googleNotice.action === 'signup' && (
              <Link to="/signup" className="inline-block mt-1.5">
                <Button size="sm">Create Nukkad account</Button>
              </Link>
            )}
          </div>
        )}
        <GoogleSignInButton />
      </form>
    </AuthLayout>
  )
}
