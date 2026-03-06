'use client'

import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-accent-red ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'input-field',
        error && 'border-accent-red/50 focus:ring-accent-red/30',
        className
      )}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'input-field resize-none',
        error && 'border-accent-red/50 focus:ring-accent-red/30',
        className
      )}
      rows={4}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  error?: boolean
}

export function Select({ options, className, error, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'input-field',
        error && 'border-accent-red/50 focus:ring-accent-red/30',
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-bg-elevated">
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'w-10 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-brand-600' : 'bg-bg-hover'
          )}
        />
        <div
          className={cn(
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-4'
          )}
        />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  )
}
