import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Users, Lightbulb, Rocket, Briefcase, CalendarDays, X } from 'lucide-react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { Avatar } from '@/components/ui/Avatar'
import { cn, initials, formatDateOnly } from '@/lib/utils'
import type { User } from '@/types/user'
import type { Idea } from '@/types/idea'
import type { Startup } from '@/types/startup'
import type { Opportunity } from '@/types/opportunity'
import type { NukkadEvent } from '@/types/event'

type FlatItem =
  | { kind: 'person'; data: User }
  | { kind: 'idea'; data: Idea }
  | { kind: 'startup'; data: Startup }
  | { kind: 'opportunity'; data: Opportunity }
  | { kind: 'event'; data: NukkadEvent }
  | { kind: 'search-all' }

function routeFor(item: FlatItem, query: string): string {
  switch (item.kind) {
    case 'person':
      return `/people/${item.data.id}`
    case 'idea':
      return `/ideas/${item.data.id}`
    case 'startup':
      return `/startups/${item.data.id}`
    case 'opportunity':
      return `/opportunities/${item.data.id}`
    case 'event':
      return `/events/${item.data.id}`
    case 'search-all':
      return `/search?q=${encodeURIComponent(query)}`
  }
}

function CategoryHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-fg-muted/80">
      {icon}
      {label}
    </div>
  )
}

function SuggestionRow({
  active,
  onSelect,
  onHover,
  children,
}: {
  active: boolean
  onSelect: () => void
  onHover: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer transition-colors',
        active ? 'bg-surface-hover' : 'hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  )
}

export function GlobalSearchBox({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [lastDebounced, setLastDebounced] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = query.trim()
  const suggestions = useSearchSuggestions(query)

  const items: FlatItem[] = useMemo(() => {
    if (!suggestions.enabled) return []
    const list: FlatItem[] = [
      ...suggestions.people.map((data): FlatItem => ({ kind: 'person', data })),
      ...suggestions.ideas.map((data): FlatItem => ({ kind: 'idea', data })),
      ...suggestions.startups.map((data): FlatItem => ({ kind: 'startup', data })),
      ...suggestions.opportunities.map((data): FlatItem => ({ kind: 'opportunity', data })),
      ...suggestions.events.map((data): FlatItem => ({ kind: 'event', data })),
    ]
    if (trimmed) list.push({ kind: 'search-all' })
    return list
  }, [suggestions, trimmed])

  if (suggestions.debounced !== lastDebounced) {
    setLastDebounced(suggestions.debounced)
    setHighlightedIndex(-1)
  }

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function goTo(item: FlatItem) {
    navigate(routeFor(item, trimmed))
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmed) return
    if (highlightedIndex >= 0 && items[highlightedIndex]) {
      goTo(items[highlightedIndex])
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!open || items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
    }
  }

  const showDropdown = open && trimmed.length >= 2

  return (
    <div ref={containerRef} className={cn('relative', variant === 'desktop' ? 'hidden sm:flex flex-1 max-w-md' : 'flex-1 sm:hidden')}>
      <form onSubmit={handleSubmit} className="relative flex w-full items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
        <input
          ref={inputRef}
          id={`global-search-${variant}`}
          name={`global-search-${variant}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people, ideas, startups…"
          className="w-full rounded-xl border border-border/80 bg-surface-sunken/60 pl-10 pr-10 py-2 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-40 max-h-[70vh] overflow-y-auto rounded-xl border border-border/80 bg-surface shadow-xl backdrop-blur-md animate-in"
        >
          {suggestions.isLoading && (
            <div className="flex items-center gap-2 px-3.5 py-4 text-sm text-fg-muted">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </div>
          )}

          {!suggestions.isLoading && suggestions.isError && (
            <div className="px-3.5 py-4 text-sm text-fg-muted">
              Couldn't load suggestions right now. Try pressing Enter to search anyway.
            </div>
          )}

          {!suggestions.isLoading && !suggestions.isError && !suggestions.hasResults && (
            <div className="px-3.5 py-4 text-sm text-fg-muted">No results found for "{trimmed}".</div>
          )}

          {!suggestions.isLoading && !suggestions.isError && suggestions.hasResults && (
            <div className="py-1">
              {suggestions.people.length > 0 && (
                <>
                  <CategoryHeading icon={<Users className="size-3.5" />} label="People" />
                  {suggestions.people.map((person, i) => (
                    <SuggestionRow
                      key={person.id}
                      active={highlightedIndex === i}
                      onSelect={() => goTo({ kind: 'person', data: person })}
                      onHover={() => setHighlightedIndex(i)}
                    >
                      <Avatar src={person.avatarUrl} name={person.name} size="xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{person.name}</p>
                        <p className="text-xs text-fg-muted truncate">{person.headline}</p>
                      </div>
                    </SuggestionRow>
                  ))}
                </>
              )}

              {suggestions.ideas.length > 0 && (
                <>
                  <CategoryHeading icon={<Lightbulb className="size-3.5" />} label="Ideas" />
                  {suggestions.ideas.map((idea, i) => {
                    const idx = suggestions.people.length + i
                    return (
                      <SuggestionRow
                        key={idea.id}
                        active={highlightedIndex === idx}
                        onSelect={() => goTo({ kind: 'idea', data: idea })}
                        onHover={() => setHighlightedIndex(idx)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken border border-border/70 text-fg-secondary">
                          <Lightbulb className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{idea.title}</p>
                          <p className="text-xs text-fg-muted truncate">
                            {idea.stage}
                            {idea.category ? ` · ${idea.category}` : ''}
                          </p>
                        </div>
                      </SuggestionRow>
                    )
                  })}
                </>
              )}

              {suggestions.startups.length > 0 && (
                <>
                  <CategoryHeading icon={<Rocket className="size-3.5" />} label="Startups" />
                  {suggestions.startups.map((startup, i) => {
                    const idx = suggestions.people.length + suggestions.ideas.length + i
                    return (
                      <SuggestionRow
                        key={startup.id}
                        active={highlightedIndex === idx}
                        onSelect={() => goTo({ kind: 'startup', data: startup })}
                        onHover={() => setHighlightedIndex(idx)}
                      >
                        {startup.logoUrl ? (
                          <img
                            src={startup.logoUrl}
                            alt={startup.name}
                            className="size-8 shrink-0 rounded-lg object-cover border border-border/70"
                          />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken border border-border/70 text-xs font-bold text-fg">
                            {initials(startup.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{startup.name}</p>
                          <p className="text-xs text-fg-muted truncate">{startup.tagline}</p>
                        </div>
                      </SuggestionRow>
                    )
                  })}
                </>
              )}

              {suggestions.opportunities.length > 0 && (
                <>
                  <CategoryHeading icon={<Briefcase className="size-3.5" />} label="Opportunities" />
                  {suggestions.opportunities.map((opp, i) => {
                    const idx =
                      suggestions.people.length + suggestions.ideas.length + suggestions.startups.length + i
                    return (
                      <SuggestionRow
                        key={opp.id}
                        active={highlightedIndex === idx}
                        onSelect={() => goTo({ kind: 'opportunity', data: opp })}
                        onHover={() => setHighlightedIndex(idx)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken border border-border/70 text-fg-secondary">
                          <Briefcase className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{opp.title}</p>
                          <p className="text-xs text-fg-muted truncate">
                            {opp.organizationName} · {opp.type}
                          </p>
                        </div>
                      </SuggestionRow>
                    )
                  })}
                </>
              )}

              {suggestions.events.length > 0 && (
                <>
                  <CategoryHeading icon={<CalendarDays className="size-3.5" />} label="Events" />
                  {suggestions.events.map((event, i) => {
                    const idx =
                      suggestions.people.length +
                      suggestions.ideas.length +
                      suggestions.startups.length +
                      suggestions.opportunities.length +
                      i
                    return (
                      <SuggestionRow
                        key={event.id}
                        active={highlightedIndex === idx}
                        onSelect={() => goTo({ kind: 'event', data: event })}
                        onHover={() => setHighlightedIndex(idx)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken border border-border/70 text-fg-secondary">
                          <CalendarDays className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{event.title}</p>
                          <p className="text-xs text-fg-muted truncate">
                            {formatDateOnly(event.startAt)}
                            {event.location ? ` · ${event.location}` : ''}
                          </p>
                        </div>
                      </SuggestionRow>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {!suggestions.isLoading && !suggestions.isError && trimmed && (
            <>
              <div className="h-px bg-border/60" />
              <SuggestionRow
                active={highlightedIndex === items.length - 1}
                onSelect={() => goTo({ kind: 'search-all' })}
                onHover={() => setHighlightedIndex(items.length - 1)}
              >
                <Search className="size-4 text-fg-muted shrink-0" />
                <span className="text-sm font-medium text-fg">
                  Search for "<span className="font-semibold">{trimmed}</span>"
                </span>
              </SuggestionRow>
            </>
          )}
        </div>
      )}
    </div>
  )
}
