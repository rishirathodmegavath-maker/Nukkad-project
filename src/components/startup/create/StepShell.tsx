import { forwardRef, type ReactNode } from 'react'

interface StepShellProps {
  /** "Step 2 of 6" */
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

/** The heading every step shares, so the six of them read as one journey. It takes focus when a step opens, for screen readers. */
export const StepShell = forwardRef<HTMLHeadingElement, StepShellProps>(function StepShell({ eyebrow, title, description, children }, ref) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-brand">{eyebrow}</p>
        <h2 ref={ref} tabIndex={-1} className="mt-1 scroll-mt-24 text-xl font-bold tracking-tight text-fg outline-none">
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">{description}</p>
      </div>
      {children}
    </div>
  )
})
