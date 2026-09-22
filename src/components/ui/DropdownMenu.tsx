import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
  /** Controlled open state — lets a caller open the menu from something other than clicking the
   * trigger (e.g. a long-press elsewhere on the row). Omit both for the default uncontrolled behavior. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const MENU_ASSUMED_WIDTH = 220 // enough headroom for both the default 210px menu and any narrower override
const VIEWPORT_MARGIN = 8
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])'

type MenuPosition = { top: number; bottom?: never; left: number; right?: never } | { top?: never; bottom: number; left: number; right?: never }

export function DropdownMenu({ trigger, children, align = 'right', className, open: openProp, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(isControlled ? openProp : internalOpen) : next
      if (!isControlled) setInternalOpen(resolved)
      onOpenChange?.(resolved)
    },
    [isControlled, openProp, internalOpen, onOpenChange],
  )
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Positioned via a portal to document.body, in viewport (fixed) coordinates computed from the
  // trigger's own rect — a plain `absolute` popover (the previous approach) gets silently clipped
  // whenever its nearest scrolling ancestor is short on room below the trigger, which is exactly
  // what happens for a message near the bottom of the chat's own scroll container. Anchoring via
  // `bottom` instead of `top` when there isn't room below lets it grow upward without needing to
  // know the menu's rendered height in advance.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const estimatedMenuHeight = menuRef.current?.offsetHeight ?? 160
    const openUpward = window.innerHeight - rect.bottom < estimatedMenuHeight + VIEWPORT_MARGIN && rect.top > estimatedMenuHeight + VIEWPORT_MARGIN

    const left =
      align === 'right'
        ? Math.max(VIEWPORT_MARGIN, rect.right - MENU_ASSUMED_WIDTH)
        : Math.min(rect.left, window.innerWidth - MENU_ASSUMED_WIDTH - VIEWPORT_MARGIN)

    setPosition(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, left }
        : { top: rect.bottom + 4, left },
    )
  }, [open, align])

  // On open, move focus onto the first item so keyboard/screen-reader users land inside the menu
  // (matches the WAI-ARIA menu pattern); on close, give focus back to whatever opened it.
  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const firstItem = menuRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)
    firstItem?.focus()
    return () => {
      trigger?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScrollOrResize = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, setOpen])

  // Arrow-key roving between items, plus Home/End — the rest of the WAI-ARIA menu pattern that
  // Escape (above) and Tab-trapping don't cover.
  function handleMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) || !menuRef.current) return
    e.preventDefault()
    const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR))
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    let nextIndex = currentIndex
    if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    else if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = items.length - 1
    items[nextIndex]?.focus()
  }

  function handleTriggerKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'ArrowDown') return
    // A native interactive element (<button>, <a href>, <input>, …) already synthesizes its own
    // click when activated via Enter/Space — that click bubbles here and opens the menu through
    // the onClick toggle below. Handling Enter/Space here too would open it and then immediately
    // close it again on that synthesized click. Step in only for a trigger that won't do that
    // itself (e.g. a plain, non-interactive element acting as a custom trigger).
    // ArrowDown never synthesizes a click, so it's always handled here regardless of trigger type.
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('button, a[href], input, select, textarea')) {
      return
    }
    e.preventDefault()
    setOpen(true)
  }

  return (
    <div className="relative" ref={triggerRef}>
      <div
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: position.top, bottom: position.bottom, left: position.left }}
            className={cn(
              'z-50 min-w-[210px] rounded-xl border border-border/80 bg-surface shadow-xl py-1.5 animate-in backdrop-blur-md overflow-hidden',
              className,
            )}
            onClick={() => setOpen(false)}
            onKeyDown={handleMenuKeyDown}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-left cursor-pointer transition-colors font-medium outline-none focus-visible:bg-surface-hover',
        danger
          ? 'text-danger-500 hover:bg-danger-100/60 focus-visible:bg-danger-100/60'
          : 'text-fg-secondary hover:text-fg hover:bg-surface-hover',
      )}
    >
      {icon && <span className="shrink-0 size-4">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1.5 h-px bg-border/60" />
}
