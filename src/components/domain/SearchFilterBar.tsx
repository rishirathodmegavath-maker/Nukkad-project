import { useId, type ReactNode } from 'react'
import { ListFilter, X } from 'lucide-react'

interface SearchFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
  /** Accessible name for the field. Defaults to the placeholder text. */
  label?: string
  children?: ReactNode
}

/** The page's own list filter. It looks and reads differently from the header's site-wide search
 *  (filter icon, "Filter …" wording, its own labelled search landmark) so the two aren't confused. */
export function SearchFilterBar({ query, onQueryChange, placeholder = 'Filter…', label, children }: SearchFilterBarProps) {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-3.5 mb-6">
      <div role="search" aria-label={label ?? placeholder.replace(/…$/, '')} className="relative max-w-md">
        <ListFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" aria-hidden="true" />
        <input
          id={fieldId}
          name={fieldId}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label ?? placeholder.replace(/…$/, '')}
          className="h-10 w-full rounded-lg border border-border/80 bg-surface pl-10 pr-9 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
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
