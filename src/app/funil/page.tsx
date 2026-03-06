'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { TrendingUp, Search, Star, Activity, Zap, Target } from 'lucide-react'
import { getEventosFunil, getConversas } from '@/lib/nocodb'
import type { EventoFunil } from '@/types'
import { formatarDataRelativa } from '@/lib/utils'

const PAGE_SIZE = 20

const TIPO_EVENTO_CONFIG: Record<string, { color: string; icon: string }> = {
  interesse: { color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20', icon: '👀' },
  pergunta_preco: { color: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20', icon: '💰' },
  visita_agendada: { color: 'text-brand-400 bg-brand-400/10 border-brand-400/20', icon: '📅' },
  matricula: { color: 'text-accent-green bg-accent-green/10 border-accent-green/20', icon: '✅' },
  desistencia: { color: 'text-accent-red bg-accent-red/10 border-accent-red/20', icon: '❌' },
  lead_qualificado: { color: 'text-brand-400 bg-brand-400/10 border-brand-400/20', icon: '⭐' },
}

export default function FunilPage() {
  const [eventos, setEventos] = useState<EventoFunil[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEventosFunil(undefined, { page, limit: PAGE_SIZE })
      setEventos(data.list as EventoFunil[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { carregar() }, [carregar])

  // Agrupar por tipo de evento para métricas
  const contagemPorTipo = eventos.reduce<Record<string, number>>((acc, e) => {
    acc[e.tipo_evento] = (acc[e.tipo_evento] || 0) + 1
    return acc
  }, {})

  const scoreTotal = eventos.reduce((acc, e) => acc + (e.score_incremento || 0), 0)

  // Funil visual
  const funilEtapas = [
    { label: 'Interesse', key: 'interesse', meta: 100, cor: 'bg-accent-blue' },
    { label: 'Preço', key: 'pergunta_preco', meta: 60, cor: 'bg-accent-yellow' },
    { label: 'Visita', key: 'visita_agendada', meta: 40, cor: 'bg-brand-500' },
    { label: 'Matrícula', key: 'matricula', meta: 20, cor: 'bg-accent-green' },
  ]

  const maxValor = Math.max(...funilEtapas.map(e => contagemPorTipo[e.key] || 0), 1)

  const eventosFiltrados = busca
    ? eventos.filter(e => e.tipo_evento?.toLowerCase().includes(busca.toLowerCase()) || e.descricao?.toLowerCase().includes(busca.toLowerCase()))
    : eventos

  return (
    <div className="animate-fade">
      <Header title="Funil de Vendas" subtitle="Acompanhe os eventos e conversões do funil" />

      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total Eventos" value={totalRows} icon={Activity} color="purple" loading={loading} />
          <MetricCard title="Matrículas" value={contagemPorTipo['matricula'] || 0} icon={Target} color="green" loading={loading} />
          <MetricCard title="Leads Qual." value={contagemPorTipo['lead_qualificado'] || 0} icon={Star} color="yellow" loading={loading} />
          <MetricCard title="Score Total" value={scoreTotal} icon={Zap} color="blue" loading={loading} />
        </div>

        {/* Funil Visual */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-5">Funil de Conversão</h3>
          <div className="space-y-3">
            {funilEtapas.map((etapa, i) => {
              const valor = contagemPorTipo[etapa.key] || 0
              const largura = maxValor > 0 ? `${((maxValor - i * (maxValor * 0.2)) / maxValor) * 100}%` : '100%'
              const pct = maxValor > 0 ? Math.round((valor / (contagemPorTipo['interesse'] || 1)) * 100) : 0
              return (
                <div key={etapa.key} className="flex items-center gap-4">
                  <div className="w-24 text-right">
                    <p className="text-sm font-medium text-white">{etapa.label}</p>
                    <p className="text-xs text-gray-500">{valor} eventos</p>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="w-full bg-bg-elevated rounded-full h-10 overflow-hidden">
                      <div
                        className={`h-10 ${etapa.cor} rounded-full flex items-center px-4 transition-all duration-700`}
                        style={{ width: largura }}
                      >
                        <span className="text-white text-sm font-bold">{valor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-bold text-gray-300">{i === 0 ? '100%' : `${pct}%`}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista Eventos */}
        <div className="card">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Buscar evento..." value={busca} onChange={e => setBusca(e.target.value)}
                className="input-field pl-10 py-2 text-sm" />
            </div>
            <p className="text-sm text-gray-400 ml-auto">{totalRows} eventos no total</p>
          </div>

          {loading ? <TableSkeleton rows={8} /> : eventosFiltrados.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhum evento no funil" description="Os eventos de funil aparecerão conforme as conversas evoluírem" />
          ) : (
            <>
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-header">Evento</th>
                      <th className="table-header">Conversa</th>
                      <th className="table-header">Descrição</th>
                      <th className="table-header">Score +</th>
                      <th className="table-header">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosFiltrados.map(e => {
                      const config = TIPO_EVENTO_CONFIG[e.tipo_evento] || { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: '📌' }
                      return (
                        <tr key={e.id} className="table-row">
                          <td className="table-cell">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                              <span>{config.icon}</span>
                              {e.tipo_evento?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="table-cell text-sm font-mono">#{e.conversa_id}</td>
                          <td className="table-cell text-sm text-gray-300">{e.descricao || '-'}</td>
                          <td className="table-cell">
                            {e.score_incremento > 0 && (
                              <span className="text-accent-green font-semibold">+{e.score_incremento}</span>
                            )}
                          </td>
                          <td className="table-cell text-sm text-gray-400">{formatarDataRelativa(e.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalRows={totalRows} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
