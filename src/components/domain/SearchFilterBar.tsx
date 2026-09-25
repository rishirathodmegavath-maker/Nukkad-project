import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ListFilter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
  /** Accessible name for the field. Defaults to the placeholder text. */
  label?: string
  /** Put the children (filters, actions) on the same row as the search field instead of stacked below it.
   *  For compact toolbars such as the admin lists; wraps to a second row on narrow screens. */
  inline?: boolean
  children?: ReactNode
}

const DEBOUNCE_MS = 300

/** The page's own list filter. It looks and reads differently from the header's site-wide search
 *  (filter icon, "Filter …" wording, its own labelled search landmark) so the two aren't confused.
 *
 *  The input's own typing feels instant, but `onQueryChange` — which every caller feeds straight
 *  into a server request's query key — is debounced, so a fast typist doesn't fire one request per
 *  keystroke. Clearing the field bypasses the debounce and reports immediately, since that's a
 *  single deliberate action, not mid-typing. */
export function SearchFilterBar({ query, onQueryChange, placeholder = 'Filter…', label, inline = false, children }: SearchFilterBarProps) {
  const fieldId = useId()
  const [liveValue, setLiveValue] = useState(query)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Adjusted during render, not an effect: when the query changes from outside typing (the parent
  // resets it, or the debounced callback below has just reported the same value back around), the
  // displayed value must catch up in the same render rather than lagging one extra frame behind.
  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setLiveValue(query)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleChange(value: string) {
    setLiveValue(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onQueryChange(value), DEBOUNCE_MS)
  }

  function handleClear() {
    clearTimeout(timerRef.current)
    setLiveValue('')
    onQueryChange('')
  }

  return (
    <div className={cn('flex', inline ? 'flex-wrap items-center gap-3 mb-4' : 'flex-col gap-3.5 mb-6')}>
      <div role="search" aria-label={label ?? placeholder.replace(/…$/, '')} className={cn('relative', inline ? 'w-full sm:w-80' : 'max-w-md')}>
        <ListFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" aria-hidden="true" />
        <input
          id={fieldId}
          name={fieldId}
          value={liveValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label ?? placeholder.replace(/…$/, '')}
          className="h-10 w-full rounded-lg border border-border/80 bg-surface pl-10 pr-9 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
        />
        {liveValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear filter"
            className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
