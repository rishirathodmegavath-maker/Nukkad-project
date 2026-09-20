import { useId, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'

interface SearchFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
  children?: ReactNode
}

export function SearchFilterBar({ query, onQueryChange, placeholder = 'Search…', children }: SearchFilterBarProps) {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-3.5 mb-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
        <input
          id={fieldId}
          name={fieldId}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border/80 bg-surface pl-10 pr-9 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
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

