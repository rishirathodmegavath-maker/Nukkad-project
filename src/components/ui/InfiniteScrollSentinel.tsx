import { useEffect, useRef } from 'react'

interface InfiniteScrollSentinelProps {
  onIntersect: () => void
  enabled?: boolean
}

/** An invisible marker placed at the end of a list — fires `onIntersect` once it scrolls near
 *  view, the trigger for fetching the next page of an infinite-scroll list. `rootMargin` starts
 *  the fetch a little before the marker is actually on screen, so the next page is usually ready
 *  by the time the user reaches the bottom. */
export function InfiniteScrollSentinel({ onIntersect, enabled = true }: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersect()
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return <div ref={ref} aria-hidden="true" className="h-1" />
}
