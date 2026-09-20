import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, MailX } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

/** Stands in for the forgot / reset screens while the switch is loading or off. */
export function AdminPasswordResetGatePage({ loading }: { loading: boolean }) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <Logo size="md" />
          <span className="text-xl font-bold tracking-tight text-fg">BuildAdda</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm">
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-fg-muted">
              <Loader2 className="size-4 animate-spin" /> Checking…
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MailX className="size-5 text-fg-muted" />
                <h1 className="text-lg font-bold text-fg tracking-tight">Reset by email isn't on yet</h1>
              </div>
              <p className="text-sm text-fg-muted">
                Emailed password reset hasn't been switched on for this control panel yet.
              </p>
              <p className="text-sm text-fg-muted">
                If you're signed in, use <span className="font-medium text-fg">Change password</span> in the panel header.
                Otherwise, ask the platform owner to reset your password.
              </p>
            </div>
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
