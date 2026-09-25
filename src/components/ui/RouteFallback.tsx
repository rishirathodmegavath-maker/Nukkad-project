import { Loader2 } from 'lucide-react'

/** What shows in the page area while a route's code is being downloaded (the surrounding layout stays put). */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center text-fg-muted">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
