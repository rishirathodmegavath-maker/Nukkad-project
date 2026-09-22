import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepItem {
  key: string
  label: string
}

interface StepperProps {
  steps: StepItem[]
  /** Index of the step the person is on. */
  current: number
  /** Called when a step that is already done is clicked, to go back to it. Later steps are never clickable. */
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Progress through a multi-step form: a numbered circle per step, done steps with a check, the current step
 * highlighted. On a phone the labels are too wide for six steps, so only the current one is spelled out below.
 */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <div className={className}>
      <ol aria-label="Progress" className="flex items-start">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          const clickable = done && !!onStepClick
          const circle = (
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                done && 'border-brand-600 bg-brand-600 text-white',
                active && 'border-brand-600 bg-brand-500/10 text-fg-brand ring-4 ring-brand-500/15',
                !done && !active && 'border-border-strong bg-surface text-fg-muted',
              )}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
          )
          return (
            <li key={step.key} aria-current={active ? 'step' : undefined} className={cn('flex min-w-0 items-start', index < steps.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    aria-label={`Go back to ${step.label}`}
                    className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {circle}
                  </button>
                ) : (
                  circle
                )}
                <span className={cn('hidden text-xs font-medium sm:block', active ? 'text-fg' : 'text-fg-muted')}>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={cn('mx-2 mt-4 h-0.5 min-w-3 flex-1 rounded-full', done ? 'bg-brand-600' : 'bg-border')} />
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-xs font-medium text-fg-secondary sm:hidden">
        Step {current + 1} of {steps.length} · <span className="text-fg">{steps[current]?.label}</span>
      </p>
    </div>
  )
}
