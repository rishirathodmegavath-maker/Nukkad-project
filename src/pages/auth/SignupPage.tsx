import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { resendVerificationEmail } from '@/services/auth.service'
import { toast } from '@/store/toast.store'

const PASSWORD_REQUIREMENTS = 'At least 10 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((s) => s.signup)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldError('')
    setFormError('')

    if (!isStrongPassword(password)) {
      setFieldError(PASSWORD_REQUIREMENTS)
      return
    }
    if (password !== confirmPassword) {
      setFieldError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim()
      const result = await signup({ name, email, password })
      if (result.verified) {
        toast.success('Account created — you can log in now.')
        navigate('/login', { replace: true })
        return
      }
      setRegisteredEmail(result.email)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (!registeredEmail) return
    setIsResending(true)
    try {
      await resendVerificationEmail(registeredEmail)
      toast.success('Verification email sent again.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  if (registeredEmail) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="One more step to activate your account."
        footer={
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CheckCircle2 className="size-10 text-success-500" />
          <p className="text-sm text-fg">
            We've sent a verification link to <span className="font-medium">{registeredEmail}</span>. Verify your
            email to activate your Buildadda account.
          </p>
          <Button variant="secondary" size="sm" isLoading={isResending} onClick={handleResend}>
            Resend verification email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your Buildadda account"
      subtitle="Join builders discovering ideas, teams and opportunities."
      footer={
        <>
          Already on Buildadda?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            leftIcon={<User className="size-4" />}
            placeholder="Aarav"
          />
          <Input
            label="Last name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Mehta"
          />
        </div>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="size-4" />}
          placeholder="you@example.com"
        />
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="size-4" />}
            placeholder="Create a strong password"
          />
          <p className="text-xs text-fg-muted">{PASSWORD_REQUIREMENTS}</p>
        </div>
        <PasswordInput
          label="Confirm password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="size-4" />}
          placeholder="Re-enter your password"
          error={fieldError || undefined}
        />
        {formError && (
          <p role="alert" className="text-sm text-danger-500 -mt-2">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Create account
        </Button>
        <p className="text-xs text-fg-muted text-center">
          By continuing you agree to Buildadda's Terms and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  )
}
