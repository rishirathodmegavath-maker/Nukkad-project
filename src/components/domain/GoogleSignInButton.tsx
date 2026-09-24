import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'
import { googleRedirectUri } from '@/lib/google-auth'
import { linkGoogleAccount } from '@/services/auth.service'
import { ApiError } from '@/lib/api-client'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const OAUTH_STATE_KEY = 'buildadda.google_oauth_state'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.75l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

interface GoogleSignInButtonProps {
  /** 'login' authenticates an existing linked account via a full-page redirect (see below).
   *  'link' attaches Google to the currently logged-in account from Settings, in place, via a
   *  popup ID-token credential — it never signs the user in or out. */
  mode?: 'login' | 'link'
  onSuccess?: () => void
  onError?: (error: ApiError | Error) => void
}

/**
 * mode="login" uses Google's own OAuth 2.0 authorization-code redirect flow
 * (`google.accounts.oauth2.initCodeClient` with `ux_mode: 'redirect'`) — a real top-level browser
 * navigation to Google and back, with no popup, iframe, or postMessage handoff involved. That
 * handoff was the actual point of failure on mobile: Google's credential-callback mechanism
 * depends on delivering a message back into this page's JS, which is subject to a wide range of
 * undocumented mobile browser/FedCM restrictions we have no visibility into. A full-page redirect
 * is the same mechanism OAuth has used since 2007 and behaves identically across every browser.
 * Because the page navigates away, `onSuccess`/`onError` are not used in this mode — the result is
 * handled by GoogleCallbackPage after Google redirects back.
 *
 * mode="link" happens from an already-authenticated Settings page, a lower-stakes context where
 * the simpler Google Identity Services popup/credential flow is acceptable — it renders Google's
 * own button and calls back with an ID token, which is exchanged via `onSuccess`/`onError`.
 */
export function GoogleSignInButton({ mode = 'login', onSuccess, onError }: GoogleSignInButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Settings passes new onSuccess/onError function instances on every render (unmemoized) —
  // reading the latest via refs instead of depending on them directly keeps the init effect below
  // from tearing down and re-registering the GIS button on every render.
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useLayoutEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  })

  function handleLoginClick() {
    if (!CLIENT_ID || !window.google) {
      toast.error("Google sign-in couldn't be completed. Please try again.")
      return
    }
    setIsRedirecting(true)
    // Round-tripped back to us via the redirect's `state` query param and checked in
    // GoogleCallbackPage — CSRF protection for the OAuth exchange. localStorage (not sessionStorage)
    // because in-app browsers (WhatsApp/Instagram) commonly hand the Google step off to a different
    // browser context that doesn't share the originating tab's session storage.
    const state = crypto.randomUUID()
    localStorage.setItem(OAUTH_STATE_KEY, state)
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'redirect',
      redirect_uri: googleRedirectUri(),
      state,
    })
    client.requestCode()
  }

  useEffect(() => {
    if (mode !== 'link' || !CLIENT_ID || !containerRef.current) return

    let cancelled = false
    function render() {
      if (cancelled || !window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            await linkGoogleAccount(response.credential)
            onSuccessRef.current?.()
          } catch (err) {
            if (onErrorRef.current && err instanceof Error) {
              onErrorRef.current(err)
            } else {
              toast.error(err instanceof Error ? err.message : 'Google sign-in failed')
            }
          }
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
    }

    if (window.google) {
      render()
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          render()
        }
      }, 100)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }
  }, [mode])

  if (!CLIENT_ID) return null

  if (mode === 'link') {
    return <div ref={containerRef} />
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-fg-muted">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        isLoading={isRedirecting}
        leftIcon={isRedirecting ? undefined : <GoogleLogo />}
        onClick={handleLoginClick}
      >
        Continue with Google
      </Button>
    </div>
  )
}
