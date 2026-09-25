import { lazy } from 'react'

const LAST_RELOAD_KEY = 'buildadda.chunkReloadAt'
/** A second failure this soon after a reload is not a stale release, so it is surfaced instead of reloaded again. */
const RELOAD_COOLDOWN_MS = 30_000

type PageLoader = Parameters<typeof lazy>[0]

function reloadedRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(LAST_RELOAD_KEY))
    return Number.isFinite(at) && at > 0 && Date.now() - at < RELOAD_COOLDOWN_MS
  } catch {
    // Storage can be blocked (private windows). Treat that as "already reloaded": a single failure then shows the
    // error screen rather than risking a reload loop we cannot detect.
    return true
  }
}

function markReload() {
  try {
    sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()))
  } catch {
    // reloadedRecently() already answered "true" when storage is unavailable, so nothing depends on this write.
  }
}

/**
 * `React.lazy` for a route's page, so its code is only downloaded when someone opens it.
 *
 * A tab left open across a release still has the old index.html, which asks for chunk files the new release no longer
 * serves; the server answers with the app's HTML instead and the import fails. One automatic reload picks up the new
 * release. The cooldown is what stops that turning into a loop when the failure is something else (offline, a real
 * bug): it is deliberately a time window, not a "succeeded since" flag, because the reloaded page loads other chunks
 * fine before the broken one is asked for.
 */
export function lazyPage(load: PageLoader) {
  return lazy(async () => {
    try {
      return await load()
    } catch (error) {
      if (!reloadedRecently()) {
        markReload()
        window.location.reload()
        return new Promise<never>(() => {})
      }
      throw error
    }
  })
}
