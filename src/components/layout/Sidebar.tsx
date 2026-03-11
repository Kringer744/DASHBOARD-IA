'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Bot,
  BookOpen,
  MessageSquare,
  Clock,
  TrendingUp,
  Plug,
  AlertTriangle,
  Database,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { LogOut } from 'lucide-react'

const navItems = [
  {
    section: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { href: '/empresas', label: 'Empresas', icon: Building2 },
      { href: '/unidades', label: 'Unidades', icon: MapPin },
      { href: '/planos', label: 'Planos', icon: CreditCard },
    ],
  },
  {
    section: 'Inteligência Artificial',
    items: [
      { href: '/ia', label: 'Config. IA', icon: Bot },
      { href: '/faq', label: 'Base de Conhecimento', icon: BookOpen },
      { href: '/cache', label: 'Cache Respostas', icon: Database },
    ],
  },
  {
    section: 'Atendimento',
    items: [
      { href: '/conversas', label: 'Conversas', icon: MessageSquare },
      { href: '/followups', label: 'Followups', icon: Clock },
      { href: '/funil', label: 'Funil de Vendas', icon: TrendingUp },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { href: '/integracoes', label: 'Integrações', icon: Plug },
      { href: '/logs', label: 'Logs de Erro', icon: AlertTriangle },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-bg-secondary border-r border-bg-border',
        'transition-all duration-300 ease-in-out sticky top-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-bg-border">
        <img src="/fluxo-logo.svg" alt="Fluxo" className="w-9 h-9 flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-base leading-tight">Fluxo Digital</p>
            <p className="text-xs text-gray-500">& Tech</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto p-1 rounded-md text-gray-500 hover:text-white hover:bg-bg-hover transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navItems.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      isActive ? 'nav-item-active' : 'nav-item',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className={cn('flex-shrink-0', isActive ? 'text-brand-400' : '', 'w-[18px] h-[18px]')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-bg-border p-3 space-y-2">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-blue flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <span className="text-xs font-bold text-white">
              {user?.empresaNome ? user.empresaNome.substring(0, 2).toUpperCase() : 'AD'}
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.empresaNome || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors text-sm font-medium',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  )
}
