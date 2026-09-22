import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Text a founder typed: line breaks kept, and a very long word or URL wraps instead of pushing the page wider. */
export function RichText({ children, clamp, className }: { children: string; clamp?: boolean; className?: string }) {
  return (
    <p className={cn('whitespace-pre-line text-sm leading-relaxed text-fg-secondary [overflow-wrap:anywhere]', clamp && 'line-clamp-5', className)}>
      {children}
    </p>
  )
}

/** True when a piece of text is long enough that a short preview would cut it off. */
function isLongText(text: string): boolean {
  return text.length > 280 || text.split('\n').length > 5
}

/** A small labelled block inside a card: a quiet heading over the value. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</h3>
      {children}
    </div>
  )
}

/** A preview that expands in place: for a card that shows the start of a long text and lets the reader open the rest. */
export function ExpandableText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = isLongText(text)
  return (
    <div>
      <RichText clamp={long && !open}>{text}</RichText>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-1.5 cursor-pointer text-sm font-semibold text-fg-brand hover:underline"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
