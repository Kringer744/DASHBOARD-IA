'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StatusBadge } from '@/components/ui/Badge'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import {
  MessageSquare, Search, ExternalLink, MessageCircle,
  Users, CheckCircle, Clock
} from 'lucide-react'
import { getConversas, getEmpresas } from '@/lib/nocodb'
import type { Conversa, Empresa } from '@/types'
import { formatarDataRelativa, truncarTexto, getIniciais } from '@/lib/utils'
import Link from 'next/link'

const PAGE_SIZE = 20

export default function ConversasPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      let where = ''
      if (busca) where = `(contato_nome,like,%${busca}%)~or(contato_telefone,like,%${busca}%)`
      if (statusFiltro) {
        const statusWhere = `(status,eq,${statusFiltro})`
        where = where ? `${where}~and${statusWhere}` : statusWhere
      }
      const data = await getConversas(empresaId, { page, limit: PAGE_SIZE, where: where || undefined })
      setConversas(data.list as Conversa[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, busca, empresaFiltro, statusFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const stats = {
    total: totalRows,
    abertas: conversas.filter(c => c.status === 'open').length,
    fechadas: conversas.filter(c => c.status === 'closed').length,
    leads: conversas.filter(c => c.lead_qualificado).length,
  }

  const statusCores: Record<string, string> = {
    open: 'text-accent-blue',
    closed: 'text-gray-400',
    pending: 'text-accent-yellow',
    resolved: 'text-accent-green',
  }

  return (
    <div className="animate-fade">
      <Header
        title="Conversas"
        subtitle="Histórico completo de atendimentos"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total" value={totalRows} icon={MessageSquare} color="purple" loading={loading} />
          <MetricCard title="Em Aberto" value={stats.abertas} icon={MessageCircle} color="blue" loading={loading} />
          <MetricCard title="Leads" value={stats.leads} icon={Users} color="green" loading={loading} />
          <MetricCard title="Fechadas" value={stats.fechadas} icon={CheckCircle} color="yellow" loading={loading} />
        </div>

        <div className="card">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por contato ou telefone..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPage(1) }}
                className="input-field pl-10 py-2 text-sm"
              />
            </div>
            <select
              value={empresaFiltro}
              onChange={(e) => { setEmpresaFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-44"
            >
              <option value="">Todas as empresas</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>
              ))}
            </select>
            <select
              value={statusFiltro}
              onChange={(e) => { setStatusFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-36"
            >
              <option value="">Todos status</option>
              <option value="open">Aberto</option>
              <option value="closed">Fechado</option>
              <option value="pending">Pendente</option>
              <option value="resolved">Resolvido</option>
            </select>
          </div>

          {loading ? (
            <TableSkeleton rows={10} />
          ) : conversas.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Nenhuma conversa encontrada"
              description="As conversas aparecerão aqui quando houver atendimentos"
            />
          ) : (
            <>
              <div className="divide-y divide-bg-border/50">
                {conversas.map((conversa) => (
                  <div key={conversa.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover/30 transition-colors group">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-300">{getIniciais(conversa.contato_nome)}</span>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{conversa.contato_nome}</p>
                        {conversa.lead_qualificado && (
                          <span className="text-[10px] font-bold text-accent-green border border-accent-green/30 bg-accent-green/10 px-1.5 py-0.5 rounded-full">LEAD</span>
                        )}
                        {conversa.conversao_detectada && (
                          <span className="text-[10px] font-bold text-accent-yellow border border-accent-yellow/30 bg-accent-yellow/10 px-1.5 py-0.5 rounded-full">CONVERSÃO</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{conversa.contato_telefone}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {truncarTexto(conversa.primeira_mensagem || 'Sem mensagem', 70)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">{conversa.total_mensagens_cliente}</p>
                        <p className="text-xs text-gray-500">Msg usuário</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-brand-400">{conversa.total_mensagens_ia}</p>
                        <p className="text-xs text-gray-500">Msg IA</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-accent-yellow">{conversa.score_interesse}</p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    </div>

                    {/* Status e data */}
                    <div className="text-right flex-shrink-0 space-y-1">
                      <StatusBadge status={conversa.status} />
                      <p className="text-xs text-gray-500">{formatarDataRelativa(conversa.created_at)}</p>
                    </div>

                    {/* Link */}
                    <Link
                      href={`/conversas/${conversa.id}`}
                      className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
              <Pagination page={page} totalRows={totalRows} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
