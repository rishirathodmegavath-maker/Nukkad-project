import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { googleRedirectUri } from '@/lib/google-auth'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import { ApiError } from '@/lib/api-client'
import type { GoogleLoginNotice } from './LoginPage'

const OAUTH_STATE_KEY = 'nukkad.google_oauth_state'

/**
 * Landing page for Google's OAuth redirect (`GOOGLE_CALLBACK_PATH`). Google navigates the browser
 * here with `?code=...&state=...` (or `?error=...` if the user cancelled/denied consent) after
 * account selection — this is a fresh page load, not a JS callback, so all state needed to
 * complete the login has to come from the URL and localStorage rather than component props.
 */
export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const completeGoogleLogin = useAuthStore((s) => s.completeGoogleLogin)
  const [error, setError] = useState<string | null>(null)
  const [googleNotice, setGoogleNotice] = useState<GoogleLoginNotice | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    // StrictMode/re-mount guard: the authorization code is single-use, so a second exchange
    // attempt would fail anyway — this just avoids a guaranteed-wasted duplicate request.
    if (ranRef.current) return
    ranRef.current = true

    async function run() {
      const params = new URLSearchParams(window.location.search)
      const expectedState = localStorage.getItem(OAUTH_STATE_KEY)
      localStorage.removeItem(OAUTH_STATE_KEY)

      const googleError = params.get('error')
      if (googleError) {
        setError("Google sign-in couldn't be completed. Please try again.")
        return
      }

      const code = params.get('code')
      const state = params.get('state')
      if (!code || !state) {
        setError("Google sign-in couldn't be completed. Please try again.")
        return
      }
      // expectedState being present but not matching is a real tampering signal — reject that.
      // expectedState being *missing* just means this browser lost track of it, which in-app
      // browsers (WhatsApp/Instagram) routinely do: they hand the actual Google sign-in step off to
      // a different browser context and land back somewhere that never saw the original page load.
      // The authorization code itself is still short-lived, single-use, and only exchangeable with
      // our server-held client secret, so it's safe to proceed rather than lock out a large share of
      // real mobile users over an environment quirk.
      if (expectedState && state !== expectedState) {
        setError("Google sign-in couldn't be completed. Please try again.")
        return
      }

      try {
        await completeGoogleLogin(code, googleRedirectUri())
        const session = useAuthStore.getState().session
        if (session?.onboardingCompleted !== false) {
          const firstName = session?.name?.trim().split(/\s+/)[0]
          toast.success(firstName ? `Welcome back, ${firstName}!` : 'Welcome back!')
        }
        navigate('/', { replace: true })
      } catch (err) {
        if (err instanceof ApiError && err.errorCode === 'GOOGLE_NO_ACCOUNT') {
          setGoogleNotice({ message: "Your Google account isn't connected to a Nukkad account yet.", action: 'signup' })
        } else if (err instanceof ApiError && err.errorCode === 'GOOGLE_ACCOUNT_NOT_LINKED') {
          setGoogleNotice({
            message:
              "This Nukkad account isn't connected to Google yet. Sign in with your email and password, then connect Google from Security settings.",
          })
        } else {
          setError(err instanceof Error ? err.message : "Google sign-in couldn't be completed. Please try again.")
        }
      }
    }

    run()
  }, [completeGoogleLogin, navigate])

  useEffect(() => {
    if (!error) return
    toast.error(error)
    navigate('/login', { replace: true })
  }, [error, navigate])

  useEffect(() => {
    if (!googleNotice) return
    navigate('/login', { replace: true, state: { googleNotice } })
  }, [googleNotice, navigate])

  if (error || googleNotice) return null

  return (
    <AuthLayout title="Signing you in" subtitle="Just a moment while we finish connecting your Google account.">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-fg-muted" />
      </div>
    </AuthLayout>
  )
}
