/**
 * The admin control panel is a separate site served from its own host (admin.…) by this same build.
 * `VITE_APP_MODE=admin` forces it for local development, where there is no admin.* hostname.
 * On the admin host the member application is never mounted, and on every other host the admin
 * panel is never mounted — the two share no routes, no session, and no API audience.
 */
export const isAdminPortal: boolean =
  import.meta.env.VITE_APP_MODE === 'admin' ||
  (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.'))
