'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Database, Search, Zap, RefreshCw, Clock, BarChart2 } from 'lucide-react'
import { getCacheRespostas, getEmpresas } from '@/lib/nocodb'
import type { CacheResposta, Empresa } from '@/types'
import { formatarDataRelativa, truncarTexto, formatarNumero } from '@/lib/utils'

const PAGE_SIZE = 20

export default function CachePage() {
  const [caches, setCaches] = useState<CacheResposta[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const data = await getCacheRespostas(empresaId, { page, limit: PAGE_SIZE })
      setCaches(data.list as CacheResposta[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, empresaFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const totalUsos = caches.reduce((acc, c) => acc + (c.vezes_usado || 0), 0)
  const totalTokens = caches.reduce((acc, c) => acc + (c.tokens_gastos || 0), 0)
  const tempoMedio = caches.length > 0
    ? Math.round(caches.reduce((acc, c) => acc + (c.tempo_resposta || 0), 0) / caches.length)
    : 0

  const filtrados = busca
    ? caches.filter(c => c.pergunta?.toLowerCase().includes(busca.toLowerCase()))
    : caches

  return (
    <div className="animate-fade">
      <Header title="Cache de Respostas" subtitle="Respostas em cache para otimização da IA" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Em Cache" value={totalRows} icon={Database} color="purple" loading={loading} />
          <MetricCard title="Total Usos" value={totalUsos} icon={RefreshCw} color="blue" loading={loading} />
          <MetricCard title="Tokens Gastos" value={formatarNumero(totalTokens)} icon={Zap} color="yellow" loading={loading} />
          <MetricCard title="T. Médio" value={`${tempoMedio}ms`} icon={Clock} color="green" loading={loading} />
        </div>

        {/* Info sobre cache */}
        <div className="card p-5 bg-card-gradient border-brand-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Auto Aprendizado Ativo</h3>
              <p className="text-sm text-gray-400">
                O sistema salva respostas frequentes para responder mais rápido. Cada cache representa uma economia de tokens e latência.
                Com {totalRows} respostas em cache e {totalUsos} reutilizações, o sistema economizou processamento da IA.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-brand-400">{totalUsos > 0 ? Math.round((totalUsos / Math.max(totalRows, 1)) * 10) / 10 : 0}x</p>
              <p className="text-xs text-gray-400">média uso por item</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Buscar pergunta..." value={busca}
                onChange={e => setBusca(e.target.value)} className="input-field pl-10 py-2 text-sm" />
            </div>
            <select value={empresaFiltro} onChange={e => { setEmpresaFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-44">
              <option value="">Todas empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
            </select>
            <button onClick={carregar} className="btn-ghost text-sm">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {loading ? <TableSkeleton rows={10} /> : filtrados.length === 0 ? (
            <EmptyState
              icon={Database}
              title="Nenhum cache encontrado"
              description="O cache será preenchido automaticamente conforme a IA responde perguntas frequentes"
            />
          ) : (
            <>
              <div className="divide-y divide-bg-border/50">
                {filtrados.map(c => (
                  <div key={c.id} className="px-5 py-4 hover:bg-bg-hover/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">{truncarTexto(c.pergunta, 80)}</p>
                        <p className="text-xs text-gray-400">{truncarTexto(c.resposta, 100)}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <RefreshCw className="w-3 h-3" />{c.vezes_usado} usos
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Zap className="w-3 h-3" />{c.tokens_gastos} tokens
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />{c.tempo_resposta}ms
                          </span>
                          <Badge variant="info">{c.modelo_usado}</Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <BarChart2 className="w-3 h-3" />
                          <span className="font-semibold text-brand-400 text-sm">{c.vezes_usado}x</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatarDataRelativa(c.ultima_vez_usado)}</p>
                      </div>
                    </div>
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
