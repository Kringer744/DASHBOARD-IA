'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalRows: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalRows, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(totalRows / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalRows)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-bg-border">
      <p className="text-sm text-gray-400">
        Mostrando <span className="text-white">{start}–{end}</span> de{' '}
        <span className="text-white">{totalRows}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            page === 1
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-bg-hover'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (page <= 3) {
            pageNum = i + 1
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = page - 2 + i
          }
          return (
            <button
              key={pageNum}
              onClick={() => onChange(pageNum)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                pageNum === page
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-bg-hover'
              )}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            'p-2 rounded-lg transition-colors',
            page === totalPages
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-bg-hover'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
