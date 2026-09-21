import { useId, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  /**
   * The longest a single tag may be. Each tag is stored in a database column of that size, so a longer one
   * would make the whole save fail. Text over the limit is not added; a live count and message say why.
   * Leave it out where a tag has no practical limit.
   */
  maxLength?: number
}

/** Type + Enter to add a tag, click × to remove — used for skills, project tech stacks, etc. */
export function TagInput({ value, onChange, placeholder = 'Type and press Enter…', className, maxLength }: TagInputProps) {
  const [draft, setDraft] = useState('')
  // This can render more than once on the same form (skills + tech stack, etc.), so the id/name
  // has to be generated per-instance, not a fixed string.
  const fieldId = useId()
  const hintId = `${fieldId}-hint`

  const length = draft.trim().length
  const tooLong = maxLength !== undefined && length > maxLength
  // Only show the count once it matters, so short tags stay uncluttered.
  const showCount = maxLength !== undefined && length >= Math.floor(maxLength * 0.8)

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft('')
      return
    }
    // Keep what was typed so it can be shortened, instead of adding it or silently throwing it away.
    if (tooLong) return
    if (!value.includes(trimmed)) onChange([...value, trimmed])
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-xl border bg-surface px-3 py-2 transition-all focus-within:ring-2 shadow-2xs',
          tooLong
            ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20'
            : 'border-border/80 focus-within:border-brand-500 focus-within:ring-brand-500/20',
          className,
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700/40 text-xs font-medium pl-2.5 pr-1.5 py-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="flex size-4 items-center justify-center rounded-full hover:bg-brand-200/60 dark:hover:bg-brand-800/60 cursor-pointer transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          name={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-invalid={tooLong || undefined}
          aria-describedby={showCount ? hintId : undefined}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-1 text-fg placeholder:text-fg-muted"
        />
      </div>
      {showCount && (
        <p id={hintId} role={tooLong ? 'alert' : undefined} className={cn('mt-1.5 text-xs', tooLong ? 'font-medium text-danger-500' : 'text-fg-muted')}>
          {tooLong
            ? `Too long to add: ${length} of ${maxLength} characters. Shorten it, or split it into shorter tags.`
            : `${length} of ${maxLength} characters`}
        </p>
      )}
    </div>
  )
}
