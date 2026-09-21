import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

type MenuPosition = { top: number; bottom?: never; left: number; right?: never } | { top?: never; bottom: number; left: number; right?: never }

export function DropdownMenu({ trigger, children, align = 'right', className, open: openProp, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(open) : next
    if (!isControlled) setInternalOpen(resolved)
    onOpenChange?.(resolved)
  }
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
  }, [open])

  return (
    <div className="relative" ref={triggerRef}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, bottom: position.bottom, left: position.left }}
            className={cn(
              'z-50 min-w-[210px] rounded-xl border border-border/80 bg-surface shadow-xl py-1.5 animate-in backdrop-blur-md overflow-hidden',
              className,
            )}
            onClick={() => setOpen(false)}
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
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-left cursor-pointer transition-colors font-medium',
        danger
          ? 'text-danger-500 hover:bg-danger-100/60 dark:hover:bg-danger-950/40'
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

