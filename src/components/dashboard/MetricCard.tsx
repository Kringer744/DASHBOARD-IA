import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: {
    value: number
    label: string
  }
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'cyan'
  loading?: boolean
}

const colorConfig = {
  purple: {
    icon: 'text-brand-400 bg-brand-400/10',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  },
  blue: {
    icon: 'text-accent-blue bg-accent-blue/10',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  green: {
    icon: 'text-accent-green bg-accent-green/10',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  yellow: {
    icon: 'text-accent-yellow bg-accent-yellow/10',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
  red: {
    icon: 'text-accent-red bg-accent-red/10',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  },
  cyan: {
    icon: 'text-accent-cyan bg-accent-cyan/10',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  color = 'purple',
  loading = false,
}: MetricCardProps) {
  const config = colorConfig[color]
  const isPositive = change && change.value >= 0

  return (
    <div className={cn('metric-card', config.glow)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-bg-elevated rounded-lg animate-pulse mt-1" />
          ) : (
            <p className="metric-value">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          )}
          {change && !loading && (
            <div className={cn('mt-2 flex items-center gap-1', isPositive ? 'metric-change-pos' : 'metric-change-neg')}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {isPositive ? '+' : ''}{change.value}% {change.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', config.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
