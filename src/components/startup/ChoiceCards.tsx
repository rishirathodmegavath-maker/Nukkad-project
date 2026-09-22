import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  description: string
  icon?: ReactNode
}

interface ChoiceCardsProps<T extends string> {
  /** Names the group for screen readers, e.g. "Stage". */
  label: string
  options: ChoiceOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Tailwind grid columns for wider screens; on a phone the cards always stack. */
  columns?: 'two' | 'three'
  id?: string
}

/** A single choice out of a few, shown as selectable cards with a line of explanation each. Arrow keys move between them. */
export function ChoiceCards<T extends string>({ label, options, value, onChange, columns = 'two', id }: ChoiceCardsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((o) => o.value === value)
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length
    if (next < 0) return
    e.preventDefault()
    const target = options[next].value
    onChange(target)
    refs.current[target]?.focus()
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn('grid grid-cols-1 gap-2.5', columns === 'three' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[option.value] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              selected ? 'border-brand-500/50 bg-brand-500/10' : 'border-border/80 bg-surface hover:border-border-strong hover:bg-surface-hover',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                selected ? 'border-brand-600 bg-brand-600' : 'border-border-strong bg-surface',
              )}
            >
              {selected && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                {option.icon}
                <span className="[overflow-wrap:anywhere]">{option.label}</span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
