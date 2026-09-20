import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, CheckCircle2, XCircle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { confirmPasswordReset } from '@/services/auth.service'

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

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

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
      await confirmPasswordReset(token, password)
      setDone(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="This link is missing its reset token."
        footer={
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            Request a new reset link
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <XCircle className="size-10 text-danger-500" />
          <p className="text-sm text-fg">
            This password reset link is invalid. Request a new one to continue.
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="You can now log in with your new password."
        footer={
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CheckCircle2 className="size-10 text-success-500" />
          <p className="text-sm text-fg">Your password has been changed. All other sessions have been signed out.</p>
          <Button className="w-full mt-2" onClick={() => navigate('/login', { replace: true })}>
            Go to log in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new password for your account."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="New password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="size-4" />}
            placeholder="Create a strong password"
          />
          <p className="text-xs text-fg-muted">{PASSWORD_REQUIREMENTS}</p>
        </div>
        <PasswordInput
          label="Confirm new password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="size-4" />}
          placeholder="Re-enter your new password"
          error={fieldError || undefined}
        />
        {formError && (
          <p role="alert" className="text-sm text-danger-500 -mt-2">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}
