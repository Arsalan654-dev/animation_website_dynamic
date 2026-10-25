import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, hint, error, required, className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="admin-label">
          {label}
          {required ? <span className="ml-1 text-gold">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#9b3434]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-ink/40">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn('admin-input', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('admin-input min-h-28 resize-y', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn('admin-input appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
})

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: ReactNode
}

export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink/30 accent-[#4a1f2c]"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium leading-snug text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-ink/45">{hint}</span> : null}
      </span>
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-ink/45">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-wine' : 'bg-ink/20',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition',
            checked ? 'left-[1.375rem]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
