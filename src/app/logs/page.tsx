'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { AlertTriangle, Search, CheckCircle, XCircle, Clock, Eye, ChevronDown } from 'lucide-react'
import { getLogsErro, getEmpresas, atualizar } from '@/lib/nocodb'
import type { LogErro, Empresa } from '@/types'
import { formatarData, formatarDataRelativa, truncarTexto } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function LogsPage() {
  const [logs, setLogs] = useState<LogErro[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [resolvidoFiltro, setResolvidoFiltro] = useState('')
  const [logDetalhes, setLogDetalhes] = useState<LogErro | null>(null)
  const [expandido, setExpandido] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      let where = busca ? `(mensagem,like,%${busca}%)` : ''
      if (resolvidoFiltro !== '') {
        const rWhere = `(resolvido,eq,${resolvidoFiltro})`
        where = where ? `${where}~and(${rWhere})` : rWhere
      }
      const data = await getLogsErro(empresaId, { page, limit: PAGE_SIZE, where: where || undefined })
      setLogs(data.list as LogErro[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, busca, empresaFiltro, resolvidoFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function marcarResolvido(log: LogErro) {
    try {
      await atualizar('logs_erro', log.id, { resolvido: true })
      carregar()
    } catch (e) { console.error(e) }
  }

  const naoResolvidos = logs.filter(l => !l.resolvido).length
  const resolvidos = logs.filter(l => l.resolvido).length

  const tipoCorMap: Record<string, string> = {
    api_error: 'danger',
    timeout: 'warning',
    validation: 'info',
    network: 'danger',
    unknown: 'default',
  }

  return (
    <div className="animate-fade">
      <Header title="Logs de Erro" subtitle="Monitore e resolva erros do sistema" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total Erros" value={totalRows} icon={AlertTriangle} color="red" loading={loading} />
          <MetricCard title="Não Resolvidos" value={naoResolvidos} icon={XCircle} color="yellow" loading={loading} />
          <MetricCard title="Resolvidos" value={resolvidos} icon={CheckCircle} color="green" loading={loading} />
          <MetricCard title="Última hora" value={0} icon={Clock} color="blue" loading={loading} />
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Buscar na mensagem..." value={busca}
                onChange={e => { setBusca(e.target.value); setPage(1) }}
                className="input-field pl-10 py-2 text-sm" />
            </div>
            <select value={empresaFiltro} onChange={e => { setEmpresaFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-44">
              <option value="">Todas empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
            </select>
            <select value={resolvidoFiltro} onChange={e => { setResolvidoFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto">
              <option value="">Todos</option>
              <option value="false">Não resolvidos</option>
              <option value="true">Resolvidos</option>
            </select>
          </div>

          {loading ? <TableSkeleton rows={10} /> : logs.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nenhum log de erro" description="Os erros do sistema aparecerão aqui" />
          ) : (
            <>
              <div className="divide-y divide-bg-border/50">
                {logs.map(log => (
                  <div key={log.id}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover/30 transition-colors group">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        log.resolvido ? 'bg-accent-green/10' : 'bg-accent-red/10'
                      )}>
                        {log.resolvido
                          ? <CheckCircle className="w-4 h-4 text-accent-green" />
                          : <AlertTriangle className="w-4 h-4 text-accent-red" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={(tipoCorMap[log.tipo_erro] as 'danger' | 'warning' | 'info' | 'default') || 'default'}>
                            {log.tipo_erro || 'unknown'}
                          </Badge>
                          {log.empresa_id && (
                            <span className="text-xs text-gray-500">
                              {empresas.find(e => e.id === log.empresa_id)?.nome_fantasia || `Emp #${log.empresa_id}`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-200 mt-1">{truncarTexto(log.mensagem, 80)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatarDataRelativa(log.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!log.resolvido && (
                          <button onClick={() => marcarResolvido(log)} className="btn-ghost text-xs text-accent-green">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolver
                          </button>
                        )}
                        <button onClick={() => setLogDetalhes(log)} className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandido(expandido === log.id ? null : log.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors">
                          <ChevronDown className={cn('w-4 h-4 transition-transform', expandido === log.id && 'rotate-180')} />
                        </button>
                      </div>
                    </div>

                    {expandido === log.id && log.stack_trace && (
                      <div className="px-5 pb-4 bg-bg-secondary/30">
                        <p className="text-xs text-gray-500 mb-2">Stack Trace:</p>
                        <pre className="text-xs text-accent-red bg-bg-elevated rounded-lg p-3 overflow-x-auto max-h-40">
                          {log.stack_trace}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={page} totalRows={totalRows} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Modal detalhes */}
      <Modal open={!!logDetalhes} onClose={() => setLogDetalhes(null)} title="Detalhes do Erro" size="lg">
        {logDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Tipo de Erro</p>
                <Badge variant="danger">{logDetalhes.tipo_erro}</Badge>
              </div>
              <div>
                <p className="label">Status</p>
                <Badge variant={logDetalhes.resolvido ? 'success' : 'warning'}>
                  {logDetalhes.resolvido ? 'Resolvido' : 'Pendente'}
                </Badge>
              </div>
              <div>
                <p className="label">Data</p>
                <p className="text-sm text-gray-300">{formatarData(logDetalhes.created_at)}</p>
              </div>
              {logDetalhes.conversa_id && (
                <div>
                  <p className="label">Conversa ID</p>
                  <p className="text-sm text-gray-300 font-mono">#{logDetalhes.conversa_id}</p>
                </div>
              )}
            </div>
            <div>
              <p className="label">Mensagem</p>
              <p className="text-sm text-gray-200 bg-bg-elevated p-3 rounded-lg">{logDetalhes.mensagem}</p>
            </div>
            {logDetalhes.stack_trace && (
              <div>
                <p className="label">Stack Trace</p>
                <pre className="text-xs text-accent-red bg-bg-elevated rounded-lg p-3 overflow-auto max-h-60">{logDetalhes.stack_trace}</pre>
              </div>
            )}
            {logDetalhes.contexto && (
              <div>
                <p className="label">Contexto</p>
                <pre className="text-xs text-gray-300 bg-bg-elevated rounded-lg p-3 overflow-auto max-h-40">
                  {JSON.stringify(logDetalhes.contexto, null, 2)}
                </pre>
              </div>
            )}
            {!logDetalhes.resolvido && (
              <div className="flex justify-end">
                <button onClick={() => { marcarResolvido(logDetalhes); setLogDetalhes(null) }} className="btn-primary">
                  <CheckCircle className="w-4 h-4" />
                  Marcar como Resolvido
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
