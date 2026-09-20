import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (key: string) => void
  className?: string
  /** Accessible name for the group, e.g. "Feed view". */
  label?: string
}

/** Underline tabs: switch between views of the same page. */
export function Tabs({ items, value, onChange, className, label }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Arrow keys / Home / End move between tabs, as a tablist is expected to.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.key === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next < 0) return
    e.preventDefault()
    const key = items[next].key
    onChange(key)
    refs.current[key]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn('flex items-center gap-1 border-b border-border/80 overflow-x-auto no-scrollbar', className)}
    >
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            ref={(el) => {
              refs.current[item.key] = el
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer',
              active ? 'text-fg-brand bg-brand-500/5 rounded-t-lg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold leading-none',
                  active ? 'bg-brand-500/15 text-fg-brand' : 'bg-surface-sunken text-fg-muted',
                )}
              >
                {item.count}
              </span>
            )}
            {active && <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-brand-600" />}
          </button>
        )
      })}
    </div>
  )
}

interface PillTabsProps {
  items: TabItem[]
  value: string
  onChange: (key: string) => void
  className?: string
  /** 'soft' (default) is a tinted selected state, so a selected filter never looks like a primary action;
   *  'solid' is the strong brand fill, for the rare chip that is itself the main control. */
  tone?: 'solid' | 'soft'
  /** Accessible name for the group of filters. */
  label?: string
}

/** Filter chips: narrow down the list on the page. Each chip is a toggle button. */
export function PillTabs({ items, value, onChange, className, tone = 'soft', label }: PillTabsProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-2 flex-wrap', className)}>
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.key)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer border',
              active
                ? tone === 'soft'
                  ? 'bg-brand-500/10 text-fg-brand border-brand-500/30'
                  : 'bg-brand-600 text-white border-brand-600 shadow-xs active:scale-[0.98]'
                : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 opacity-80">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
