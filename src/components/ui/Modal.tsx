import { type ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-2xl',
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Basic focus trap: Tab/Shift+Tab wraps within the dialog instead of escaping to the page
      // underneath, which is the one part of the WAI-ARIA dialog pattern a native <dialog> would
      // give for free but a portal + fixed-position div does not.
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // On open: remember whatever had focus (to give it back on close) and move focus into the
  // dialog — onto its first focusable element, falling back to the panel itself so a screen
  // reader still announces the dialog even when it opens with no interactive content yet.
  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement
    const panel = panelRef.current
    const focusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusable ?? panel)?.focus()
    return () => {
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface rounded-xl shadow-xl border border-border max-h-[90vh] flex flex-col animate-in-modal overflow-hidden outline-none',
          sizeClasses[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/70">
            <div>
              {title && <h2 id={titleId} className="text-lg font-bold text-fg tracking-tight">{title}</h2>}
              {description && (
                <p id={descriptionId} className="text-sm text-fg-muted mt-1 leading-relaxed [overflow-wrap:anywhere]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-fg-muted hover:text-fg hover:bg-surface-hover rounded-lg p-2 shrink-0 cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/70 bg-surface-sunken/40">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
