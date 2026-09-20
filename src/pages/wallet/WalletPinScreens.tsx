import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, ShieldCheck, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, PasswordInput } from '@/components/ui/Input'
import { ApiError } from '@/lib/api-client'
import { PIN_LENGTH, WEAK_PIN_MESSAGE, digitsOnly, isWeakPin } from '@/lib/wallet-pin'
import { toast } from '@/store/toast.store'
import { changeWalletPin, createWalletPin, resetWalletPin, verifyWalletPin } from '@/services/wallet-pin.service'

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback)

function PinField({
  label,
  value,
  onChange,
  error,
  hint,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  autoFocus?: boolean
}) {
  return (
    <Input
      label={label}
      type="password"
      inputMode="numeric"
      // "off": this is a PIN, not an account password, so browsers should not offer to save it.
      autoComplete="off"
      maxLength={PIN_LENGTH}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(digitsOnly(e.target.value))}
      placeholder={'•'.repeat(PIN_LENGTH)}
      className="text-center text-xl font-semibold tracking-[0.5em] tabular-nums placeholder:tracking-[0.3em]"
      error={error}
      hint={hint}
    />
  )
}

function PinCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card variant="elevated" padding="lg" className="mx-auto w-full max-w-md">
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

/** Validates a new PIN entered twice; returns an error message, or '' when fine. */
function newPinProblem(pin: string, confirm: string): string {
  if (pin.length !== PIN_LENGTH) return `Enter a ${PIN_LENGTH}-digit PIN.`
  if (isWeakPin(pin)) return WEAK_PIN_MESSAGE
  if (pin !== confirm) return 'The two PINs do not match.'
  return ''
}

/** First-time setup: nobody has a PIN until they create one, and the wallet stays closed until they do. */
export function CreatePinCard({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [pinError, setPinError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    const problem = newPinProblem(pin, confirm)
    setPinError(problem)
    if (problem) return
    if (!password) {
      setPasswordError('Enter your account password to confirm it is you.')
      return
    }
    setBusy(true)
    try {
      await createWalletPin(pin, password)
      toast.success('Wallet PIN created')
      onUnlocked()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'WALLET_PASSWORD_INVALID') setPasswordError(err.message)
      else setPinError(errorMessage(err, 'Could not create your PIN'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PinCard
      title="Protect your wallet with a PIN"
      description="Your balance and withdrawals stay hidden until you enter this PIN. Pick 6 digits you don't use anywhere else."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PinField label="New PIN" value={pin} onChange={setPin} autoFocus />
        <PinField label="Confirm PIN" value={confirm} onChange={setConfirm} error={pinError} />
        <PasswordInput
          label="Account password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          hint="Asked once, to confirm it is you setting the PIN."
        />
        <Button type="submit" size="lg" isLoading={busy}>
          Create PIN
        </Button>
      </form>
    </PinCard>
  )
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Enter the PIN to open the wallet. `lockedUntilMs` is set when too many wrong PINs locked it. */
export function UnlockCard({
  lockedUntilMs,
  onUnlocked,
  onForgot,
  onLockedOut,
}: {
  lockedUntilMs: number
  onUnlocked: () => void
  onForgot: () => void
  /** The server just locked the wallet; the parent re-reads the status to learn for how long. */
  onLockedOut: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const isLocked = lockedUntilMs > now
  useEffect(() => {
    if (!isLocked) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [isLocked])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (pin.length !== PIN_LENGTH) {
      setError(`Enter your ${PIN_LENGTH}-digit PIN.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await verifyWalletPin(pin)
      onUnlocked()
    } catch (err) {
      setPin('')
      setError(errorMessage(err, 'Could not check your PIN'))
      if (err instanceof ApiError && err.errorCode === 'WALLET_PIN_LOCKED') {
        setNow(Date.now())
        onLockedOut()
      }
    } finally {
      setBusy(false)
    }
  }

  const secondsLeft = Math.max(0, Math.ceil((lockedUntilMs - now) / 1000))

  return (
    <PinCard title="Enter your wallet PIN" description="Your balance and transactions are hidden until you do.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PinField label="Wallet PIN" value={pin} onChange={setPin} autoFocus error={isLocked ? undefined : error} />
        {isLocked && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-100/50 px-3 py-2 text-sm text-danger-600 dark:text-danger-400">
            <Lock className="size-4 shrink-0" />
            Too many incorrect PINs. Try again in {formatCountdown(secondsLeft)}, or reset your PIN below.
          </p>
        )}
        <Button type="submit" size="lg" isLoading={busy} disabled={isLocked}>
          Unlock wallet
        </Button>
        <button type="button" onClick={onForgot} className="cursor-pointer self-center text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Forgot PIN?
        </button>
      </form>
    </PinCard>
  )
}

/** "Forgot PIN": the account password proves it is the owner, then a new PIN replaces the old one. */
export function ResetPinCard({ onUnlocked, onCancel }: { onUnlocked: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (!password) {
      setPasswordError('Enter your account password.')
      return
    }
    const problem = newPinProblem(pin, confirm)
    setPinError(problem)
    if (problem) return
    setBusy(true)
    try {
      await resetWalletPin(password, pin)
      toast.success('Wallet PIN reset')
      onUnlocked()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'WALLET_PASSWORD_INVALID') setPasswordError(err.message)
      else setPinError(errorMessage(err, 'Could not reset your PIN'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PinCard title="Reset your wallet PIN" description="Confirm your account password, then choose a new PIN. Any wrong-PIN lockout is cleared.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label="Account password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
        />
        <PinField label="New PIN" value={pin} onChange={setPin} />
        <PinField label="Confirm new PIN" value={confirm} onChange={setConfirm} error={pinError} />
        <Button type="submit" size="lg" isLoading={busy}>
          Reset PIN
        </Button>
        <button type="button" onClick={onCancel} className="cursor-pointer self-center text-sm font-medium text-fg-muted hover:text-fg hover:underline">
          Back
        </button>
      </form>
    </PinCard>
  )
}

/** Change the PIN while the wallet is open; needs the current PIN so an open session can't swap it silently. */
export function ChangePinModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [currentError, setCurrentError] = useState('')
  const [pinError, setPinError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCurrentError('')
    if (current.length !== PIN_LENGTH) {
      setCurrentError(`Enter your current ${PIN_LENGTH}-digit PIN.`)
      return
    }
    const problem = newPinProblem(pin, confirm)
    setPinError(problem)
    if (problem) return
    setBusy(true)
    try {
      await changeWalletPin(current, pin)
      toast.success('Wallet PIN changed')
      onChanged()
      onClose()
    } catch (err) {
      const message = errorMessage(err, 'Could not change your PIN')
      if (err instanceof ApiError && (err.errorCode === 'WALLET_PIN_INVALID' || err.errorCode === 'WALLET_PIN_LOCKED')) setCurrentError(message)
      else setPinError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Change wallet PIN"
      description="You'll use the new PIN from now on."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="wallet-change-pin" isLoading={busy} leftIcon={<KeyRound className="size-4" />}>
            Change PIN
          </Button>
        </>
      }
    >
      <form id="wallet-change-pin" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PinField label="Current PIN" value={current} onChange={setCurrent} error={currentError} autoFocus />
        <PinField label="New PIN" value={pin} onChange={setPin} />
        <PinField label="Confirm new PIN" value={confirm} onChange={setConfirm} error={pinError} />
      </form>
    </Modal>
  )
}
