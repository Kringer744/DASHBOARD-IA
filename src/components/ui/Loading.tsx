import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function Loading({ size = 'md', className, text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-brand-500/30 border-t-brand-500 animate-spin',
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  )
}

export function PageLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loading size="lg" text={text} />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-bg-border/50">
          <div className="h-4 bg-bg-elevated rounded w-8" />
          <div className="h-4 bg-bg-elevated rounded flex-1" />
          <div className="h-4 bg-bg-elevated rounded w-24" />
          <div className="h-4 bg-bg-elevated rounded w-20" />
          <div className="h-4 bg-bg-elevated rounded w-16" />
        </div>
      ))}
    </div>
  )
}
