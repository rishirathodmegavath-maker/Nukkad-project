import { useRef, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
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
  /** One row that scrolls sideways instead of wrapping onto several lines: for a long list of chips. */
  scrollable?: boolean
}

/** Filter chips: narrow down the list on the page. Each chip is a toggle button. */
export function PillTabs({ items, value, onChange, className, tone = 'soft', label, scrollable = false }: PillTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // `overflow-x-auto` already scrolls via the wheel (shift+scroll), a trackpad or touch — but a plain
  // mouse has no way to pan it at all, since click-and-drag isn't something the browser gives a plain
  // div for free. Tracked in a ref (not state) so mousemove never triggers a re-render.
  const drag = useRef({ isDown: false, startX: 0, startScrollLeft: 0, dragged: false })

  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (!scrollable || !scrollRef.current) return
    drag.current = { isDown: true, startX: e.pageX, startScrollLeft: scrollRef.current.scrollLeft, dragged: false }
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state.isDown || !scrollRef.current) return
    const delta = e.pageX - state.startX
    // A few pixels of slop before it counts as a drag rather than a click that happened to wobble.
    if (!state.dragged && Math.abs(delta) < 4) return
    state.dragged = true
    e.preventDefault()
    scrollRef.current.scrollLeft = state.startScrollLeft - delta
  }

  function endDrag() {
    drag.current.isDown = false
  }

  // A drag that ends over a pill would otherwise also fire that pill's click — swallow just that one.
  function handleClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (!drag.current.dragged) return
    e.preventDefault()
    e.stopPropagation()
    drag.current.dragged = false
  }

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={label}
      className={cn(
        'flex items-center gap-2',
        scrollable ? 'flex-nowrap overflow-x-auto no-scrollbar max-w-full cursor-grab active:cursor-grabbing select-none' : 'flex-wrap',
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClickCapture={handleClickCapture}
    >
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
              scrollable && 'shrink-0 whitespace-nowrap',
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
