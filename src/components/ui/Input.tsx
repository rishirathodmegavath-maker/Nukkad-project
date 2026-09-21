import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldWrapProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FieldWrap({ label, hint, error, required, className, children }: FieldWrapProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-fg-secondary">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger-500 animate-in">{error}</span>
      ) : hint ? (
        <span className="text-xs text-fg-muted">{hint}</span>
      ) : null}
    </label>
  )
}

const fieldBase =
  'w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Input({ label, hint, error, required, leftIcon, rightIcon, className, id, name, ...props }: InputProps) {
  // Falls back to a generated id/name when the caller doesn't supply one — without this, a field
  // with neither attribute set is invisible to the browser's autofill and shows up as a DevTools
  // "form field should have an id or name" issue. useId() (not a plain string) keeps every
  // instance unique even when this component renders many times on one page.
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      <span className="relative flex items-center">
        {leftIcon && <span className="absolute left-3.5 text-fg-muted pointer-events-none">{leftIcon}</span>}
        <input
          id={fieldId}
          name={name ?? fieldId}
          className={cn(
            fieldBase,
            error
              ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
              : 'border-border hover:border-border-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightIcon && <span className="absolute right-3.5 text-fg-muted">{rightIcon}</span>}
      </span>
    </FieldWrap>
  )
}

type PasswordInputProps = Omit<InputProps, 'type' | 'rightIcon'>

export function PasswordInput({ ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="pointer-events-auto text-fg-muted hover:text-fg transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, required, className, id, name, ...props }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      <textarea
        id={fieldId}
        name={name ?? fieldId}
        className={cn(
          fieldBase,
          'resize-y min-h-[100px] leading-relaxed',
          error
            ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
            : 'border-border hover:border-border-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          className,
        )}
        {...props}
      />
    </FieldWrap>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({ label, hint, error, required, className, children, id, name, ...props }: SelectProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      <div className="relative flex items-center">
        <select
          id={fieldId}
          name={name ?? fieldId}
          className={cn(
            fieldBase,
            'appearance-none pr-10 cursor-pointer',
            error
              ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
              : 'border-border hover:border-border-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3.5 size-4 text-fg-muted pointer-events-none shrink-0" />
      </div>
    </FieldWrap>
  )
}

