import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-surface-800">{label}</label>}
      <input
        {...rest}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors placeholder:text-surface-300
          ${error
            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-surface-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
          } ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
