'use client'

import { Bell, Search, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [searching, setSearching] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-bg-border px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            onFocus={() => setSearching(true)}
            onBlur={() => setSearching(false)}
            className={`bg-bg-elevated border border-bg-border rounded-lg pl-10 pr-4 py-2 text-sm
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50
              transition-all duration-200 ${searching ? 'w-64' : 'w-48'}`}
          />
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Icons */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
