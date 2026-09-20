import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { changeAdminPassword } from '@/services/admin-auth.service'
import { PASSWORD_REQUIREMENTS, isStrongPassword } from '@/lib/password'

/** Lets the signed-in admin rotate their own password. On success the server has ended every session
 *  (this one included), so the admin is sent to the sign-in page with a notice rather than left in a
 *  panel whose token no longer works. */
export function AdminChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function close() {
    if (isLoading) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (!isStrongPassword(newPassword)) {
      setError(PASSWORD_REQUIREMENTS)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The two new passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Choose a password different from the current one.')
      return
    }
    setIsLoading(true)
    try {
      await changeAdminPassword(currentPassword, newPassword)
      navigate('/login', { replace: true, state: { notice: 'Password changed. Sign in with your new password.' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Change password"
      description="You'll be signed out everywhere and asked to sign in again with the new password."
      size="sm"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          leftIcon={<Lock className="size-4" />}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Change password
          </Button>
        </div>
      </form>
    </Modal>
  )
}
