import { cn } from '@/lib/utils'
import { STATUS_COLORS, STATUS_LABELS, PLANO_COLORS, PLANO_LABELS } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

const variantClasses = {
  default: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  success: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  warning: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  danger: 'text-accent-red bg-accent-red/10 border-accent-red/20',
  info: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  purple: 'text-brand-400 bg-brand-400/10 border-brand-400/20',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        STATUS_COLORS[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PlanoBadge({ plano }: { plano: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        PLANO_COLORS[plano] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      )}
    >
      {PLANO_LABELS[plano] || plano}
    </span>
  )
}
