/**
 * The admin control panel is a separate site served from its own host (admin.…) by this same build.
 * `VITE_APP_MODE=admin` forces it for local development, where there is no admin.* hostname.
 * On the admin host the member application is never mounted, and on every other host the admin
 * panel is never mounted — the two share no routes, no session, and no API audience.
 */
export const isAdminPortal: boolean =
  import.meta.env.VITE_APP_MODE === 'admin' ||
  (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.'))

/**
 * Builds a URL into the member application from inside the admin portal — never a react-router
 * `<Link to>`, which would resolve against AdminPortalRoutes (no /people, /feed, /startups, ... —
 * it falls through to that router's own catch-all and silently bounces back to /admin). Swaps the
 * `admin.` hostname prefix for `app.` (production topology: admin.<domain> / app.<domain>); in
 * local dev, where the admin portal is forced by VITE_APP_MODE on a plain hostname with no `admin.`
 * prefix to swap, this is a same-origin link back into whichever mode the dev server is running.
 */
export function memberAppUrl(path: string): string {
  if (typeof window === 'undefined') return path
  const { protocol, hostname, port } = window.location
  const memberHostname = hostname.replace(/^admin\./, 'app.')
  return `${protocol}//${memberHostname}${port ? `:${port}` : ''}${path}`
}
