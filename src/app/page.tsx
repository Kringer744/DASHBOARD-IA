'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ConversasAreaChart, LeadsBarChart, CanalPieChart } from '@/components/dashboard/Charts'
import { StatusBadge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
import {
  Building2,
  MessageSquare,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Bot,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { getEstatisticasGerais, getEmpresas, getConversas } from '@/lib/nocodb'
import type { Empresa, Conversa } from '@/types'
import { formatarDataRelativa, truncarTexto, getIniciais, gerarCorAvatar } from '@/lib/utils'
import Link from 'next/link'

interface Stats {
  totalEmpresas: number
  totalConversas: number
  totalMensagens: number
  totalFAQs: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [conversasRecentes, setConversasRecentes] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsData, empresasData, conversasData] = await Promise.all([
          getEstatisticasGerais(),
          getEmpresas({ limit: 5 }),
          getConversas(undefined, { limit: 5, sort: '-created_at' }),
        ])
        setStats(statsData)
        setEmpresas(empresasData.list as Empresa[])
        setConversasRecentes(conversasData.list as Conversa[])
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageLoading text="Carregando dashboard..." />

  return (
    <div className="animate-fade">
      <Header
        title="Dashboard"
        subtitle="Visão geral do sistema de IA multiempresa"
      />

      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Empresas Ativas"
            value={stats?.totalEmpresas ?? 0}
            icon={Building2}
            color="purple"
          />
          <MetricCard
            title="Total de Conversas"
            value={stats?.totalConversas ?? 0}
            icon={MessageSquare}
            color="blue"
          />
          <MetricCard
            title="Total de Mensagens"
            value={stats?.totalMensagens ?? 0}
            icon={MessageCircle}
            color="green"
          />
          <MetricCard
            title="Base de Conhecimento"
            value={stats?.totalFAQs ?? 0}
            icon={BookOpen}
            color="yellow"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Área Chart - Conversas */}
          <div className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white">Conversas & Mensagens</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 7 meses</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />
                  Conversas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-blue inline-block" />
                  Mensagens
                </span>
              </div>
            </div>
            <ConversasAreaChart />
          </div>

          {/* Canal Pie */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-1">Canais de Atendimento</h3>
            <p className="text-xs text-gray-400 mb-4">Distribuição por canal</p>
            <CanalPieChart />
            <div className="space-y-2 mt-4">
              {[
                { label: 'WhatsApp', value: '65%', color: 'bg-brand-500' },
                { label: 'Web Chat', value: '20%', color: 'bg-accent-blue' },
                { label: 'E-mail', value: '10%', color: 'bg-accent-green' },
                { label: 'Outros', value: '5%', color: 'bg-accent-yellow' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Bar + Stats extras */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Bar Chart - Leads */}
          <div className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white">Geração de Leads</h3>
                <p className="text-xs text-gray-400 mt-0.5">Leads qualificados por mês</p>
              </div>
              <TrendingUp className="w-5 h-5 text-accent-green" />
            </div>
            <LeadsBarChart />
          </div>

          {/* Quick Stats */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Performance da IA</h3>
            <div className="space-y-4">
              {[
                { label: 'Taxa de Resolução', value: '87%', icon: CheckCircle, color: 'text-accent-green' },
                { label: 'Tempo Médio Resposta', value: '1.2s', icon: Clock, color: 'text-accent-blue' },
                { label: 'Satisfação', value: '4.7/5', icon: Users, color: 'text-accent-yellow' },
                { label: 'Erros Recentes', value: '3', icon: AlertCircle, color: 'text-accent-red' },
                { label: 'IA Configuradas', value: `${stats?.totalEmpresas ?? 0}`, icon: Bot, color: 'text-brand-400' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabelas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Empresas Recentes */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
              <h3 className="font-semibold text-white">Empresas</h3>
              <Link href="/empresas" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Ver todas →
              </Link>
            </div>
            <div className="divide-y divide-bg-border/50">
              {empresas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma empresa cadastrada</p>
              ) : (
                empresas.map((empresa) => (
                  <div key={empresa.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-hover/30 transition-colors">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gerarCorAvatar(empresa.nome)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">{getIniciais(empresa.nome_fantasia || empresa.nome)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{empresa.nome_fantasia || empresa.nome}</p>
                      <p className="text-xs text-gray-400">{empresa.conversas ?? 0} conversas</p>
                    </div>
                    <StatusBadge status={empresa.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversas Recentes */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
              <h3 className="font-semibold text-white">Conversas Recentes</h3>
              <Link href="/conversas" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Ver todas →
              </Link>
            </div>
            <div className="divide-y divide-bg-border/50">
              {conversasRecentes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma conversa encontrada</p>
              ) : (
                conversasRecentes.map((conversa) => (
                  <Link
                    key={conversa.id}
                    href={`/conversas/${conversa.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-hover/30 transition-colors block"
                  >
                    <div className="w-9 h-9 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-300">{getIniciais(conversa.contato_nome)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{conversa.contato_nome}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {truncarTexto(conversa.primeira_mensagem || 'Sem mensagem', 50)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusBadge status={conversa.status} />
                      <p className="text-xs text-gray-500 mt-1">{formatarDataRelativa(conversa.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
