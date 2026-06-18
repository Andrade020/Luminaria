interface Props {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'orange' | 'red'
  className?: string
}

const variants = {
  default: 'bg-surface-100 text-surface-600',
  blue:    'bg-brand-50 text-brand-700',
  green:   'bg-emerald-50 text-emerald-700',
  orange:  'bg-orange-50 text-orange-700',
  red:     'bg-red-50 text-red-700',
}

export default function Badge({ children, variant = 'default', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
