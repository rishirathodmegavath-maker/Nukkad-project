import { useId, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

/** Type + Enter to add a tag, click × to remove — used for skills, project tech stacks, etc. */
export function TagInput({ value, onChange, placeholder = 'Type and press Enter…', className }: TagInputProps) {
  const [draft, setDraft] = useState('')
  // This can render more than once on the same form (skills + tech stack, etc.), so the id/name
  // has to be generated per-instance, not a fixed string.
  const fieldId = useId()

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
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
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-2 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 shadow-2xs',
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
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-1 text-fg placeholder:text-fg-muted"
      />
    </div>
  )
}
