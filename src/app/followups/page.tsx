'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/ui/FormField'
import {
  Clock, Plus, Edit2, Trash2, Search, Send, AlertCircle, CheckCircle, XCircle, FileText
} from 'lucide-react'
import {
  getFollowups, getTemplatesFollowup, getEmpresas,
  criarFollowup, atualizarFollowup, deletarFollowup,
  criarTemplateFollowup, atualizarTemplateFollowup, deletarTemplateFollowup
} from '@/lib/nocodb'
import type { Followup, TemplateFollowup, Empresa } from '@/types'
import { formatarData, formatarDataRelativa, truncarTexto } from '@/lib/utils'

const PAGE_SIZE = 15

export default function FollowupsPage() {
  const [tab, setTab] = useState<'followups' | 'templates'>('followups')
  const [followups, setFollowups] = useState<Followup[]>([])
  const [templates, setTemplates] = useState<TemplateFollowup[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalTemplate, setModalTemplate] = useState(false)
  const [editandoFollowup, setEditandoFollowup] = useState<Followup | null>(null)
  const [editandoTemplate, setEditandoTemplate] = useState<TemplateFollowup | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; tipo: 'followup' | 'template' } | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [formFollowup, setFormFollowup] = useState({
    empresa_id: '', conversa_id: '', tipo: 'mensagem', mensagem: '',
    agendado_para: '', status: 'pending', ordem: '1',
  })

  const [formTemplate, setFormTemplate] = useState({
    empresa_id: '', nome: '', descricao: '', tipo: 'mensagem',
    mensagem: '', delay_minutos: '60', ordem: '1', ativo: true,
  })

  const carregarFollowups = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const data = await getFollowups(empresaId, { page, limit: PAGE_SIZE })
      setFollowups(data.list as Followup[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, empresaFiltro])

  const carregarTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const data = await getTemplatesFollowup(empresaId, { page, limit: PAGE_SIZE })
      setTemplates(data.list as TemplateFollowup[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, empresaFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])

  useEffect(() => {
    if (tab === 'followups') carregarFollowups()
    else carregarTemplates()
  }, [tab, carregarFollowups, carregarTemplates])

  async function salvarFollowup() {
    setSalvando(true)
    try {
      const dados = { ...formFollowup, empresa_id: parseInt(formFollowup.empresa_id), ordem: parseInt(formFollowup.ordem) }
      if (editandoFollowup) await atualizarFollowup(editandoFollowup.id, dados)
      else await criarFollowup(dados)
      setModalAberto(false)
      carregarFollowups()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function salvarTemplate() {
    setSalvando(true)
    try {
      const dados = { ...formTemplate, empresa_id: parseInt(formTemplate.empresa_id), delay_minutos: parseInt(formTemplate.delay_minutos), ordem: parseInt(formTemplate.ordem) }
      if (editandoTemplate) await atualizarTemplateFollowup(editandoTemplate.id, dados)
      else await criarTemplateFollowup(dados)
      setModalTemplate(false)
      carregarTemplates()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    try {
      if (confirmDelete.tipo === 'followup') { await deletarFollowup(confirmDelete.id); carregarFollowups() }
      else { await deletarTemplateFollowup(confirmDelete.id); carregarTemplates() }
      setConfirmDelete(null)
    } catch (e) { console.error(e) }
  }

  const getEmpresaNome = (id: number) => empresas.find(e => e.id === id)?.nome_fantasia || `Empresa #${id}`

  const statusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="w-4 h-4 text-accent-green" />
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-accent-red" />
    if (status === 'cancelled') return <XCircle className="w-4 h-4 text-gray-400" />
    return <Clock className="w-4 h-4 text-accent-yellow" />
  }

  const totalSent = followups.filter(f => f.status === 'sent').length
  const totalPending = followups.filter(f => f.status === 'pending').length
  const totalFailed = followups.filter(f => f.status === 'failed').length

  return (
    <div className="animate-fade">
      <Header
        title="Followups & Templates"
        subtitle="Automatize o acompanhamento de leads"
        actions={
          <div className="flex gap-2">
            {tab === 'followups'
              ? <button onClick={() => { setEditandoFollowup(null); setFormFollowup({ empresa_id: empresas[0]?.id?.toString() || '', conversa_id: '', tipo: 'mensagem', mensagem: '', agendado_para: '', status: 'pending', ordem: '1' }); setModalAberto(true) }} className="btn-primary"><Plus className="w-4 h-4" />Novo Followup</button>
              : <button onClick={() => { setEditandoTemplate(null); setFormTemplate({ empresa_id: empresas[0]?.id?.toString() || '', nome: '', descricao: '', tipo: 'mensagem', mensagem: '', delay_minutos: '60', ordem: '1', ativo: true }); setModalTemplate(true) }} className="btn-primary"><Plus className="w-4 h-4" />Novo Template</button>
            }
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total" value={totalRows} icon={Clock} color="purple" loading={loading} />
          <MetricCard title="Enviados" value={totalSent} icon={Send} color="green" loading={loading} />
          <MetricCard title="Pendentes" value={totalPending} icon={Clock} color="yellow" loading={loading} />
          <MetricCard title="Falhos" value={totalFailed} icon={AlertCircle} color="red" loading={loading} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-bg-elevated rounded-xl w-fit border border-bg-border">
          {(['followups', 'templates'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-bg-card text-white shadow' : 'text-gray-400 hover:text-white'}`}>
              {t === 'followups' ? 'Followups' : 'Templates'}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <select value={empresaFiltro} onChange={(e) => { setEmpresaFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-44">
              <option value="">Todas as empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
            </select>
          </div>

          {loading ? <TableSkeleton rows={8} /> : (
            <>
              {tab === 'followups' && (
                followups.length === 0 ? (
                  <EmptyState icon={Clock} title="Nenhum followup" description="Os followups agendados aparecem aqui" />
                ) : (
                  <div className="divide-y divide-bg-border/50">
                    {followups.map(f => (
                      <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover/30 transition-colors">
                        {statusIcon(f.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{truncarTexto(f.mensagem, 60)}</p>
                          <p className="text-xs text-gray-400">{getEmpresaNome(f.empresa_id)} · Conversa #{f.conversa_id}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={f.status} />
                          <p className="text-xs text-gray-500 mt-1">
                            {f.enviado_em ? formatarData(f.enviado_em) : `Ag. para ${formatarData(f.agendado_para)}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditandoFollowup(f); setFormFollowup({ empresa_id: f.empresa_id?.toString() || '', conversa_id: f.conversa_id?.toString() || '', tipo: f.tipo || 'mensagem', mensagem: f.mensagem || '', agendado_para: f.agendado_para || '', status: f.status || 'pending', ordem: f.ordem?.toString() || '1' }); setModalAberto(true) }} className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDelete({ id: f.id, tipo: 'followup' })} className="p-1.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'templates' && (
                templates.length === 0 ? (
                  <EmptyState icon={FileText} title="Nenhum template" description="Crie templates de mensagens para reutilizar" action={<button onClick={() => setModalTemplate(true)} className="btn-primary">Criar Template</button>} />
                ) : (
                  <div className="table-container">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th className="table-header">Nome</th>
                          <th className="table-header">Empresa</th>
                          <th className="table-header">Tipo</th>
                          <th className="table-header">Delay</th>
                          <th className="table-header">Status</th>
                          <th className="table-header w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map(t => (
                          <tr key={t.id} className="table-row">
                            <td className="table-cell">
                              <p className="font-medium text-white">{t.nome}</p>
                              <p className="text-xs text-gray-400">{truncarTexto(t.mensagem, 50)}</p>
                            </td>
                            <td className="table-cell text-sm">{getEmpresaNome(t.empresa_id)}</td>
                            <td className="table-cell"><Badge variant="info">{t.tipo}</Badge></td>
                            <td className="table-cell text-sm">{t.delay_minutos} min</td>
                            <td className="table-cell"><Badge variant={t.ativo ? 'success' : 'default'}>{t.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                            <td className="table-cell">
                              <div className="flex gap-1">
                                <button onClick={() => { setEditandoTemplate(t); setFormTemplate({ empresa_id: t.empresa_id?.toString() || '', nome: t.nome || '', descricao: t.descricao || '', tipo: t.tipo || 'mensagem', mensagem: t.mensagem || '', delay_minutos: t.delay_minutos?.toString() || '60', ordem: t.ordem?.toString() || '1', ativo: t.ativo ?? true }); setModalTemplate(true) }} className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => setConfirmDelete({ id: t.id, tipo: 'template' })} className="p-1.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
              <Pagination page={page} totalRows={totalRows} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Modal Followup */}
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={editandoFollowup ? 'Editar Followup' : 'Novo Followup'} size="md">
        <div className="space-y-4">
          <FormField label="Empresa" required><Select value={formFollowup.empresa_id} onChange={e => setFormFollowup({ ...formFollowup, empresa_id: e.target.value })} options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))} /></FormField>
          <FormField label="ID da Conversa"><Input value={formFollowup.conversa_id} onChange={e => setFormFollowup({ ...formFollowup, conversa_id: e.target.value })} placeholder="ID da conversa" /></FormField>
          <FormField label="Tipo"><Select value={formFollowup.tipo} onChange={e => setFormFollowup({ ...formFollowup, tipo: e.target.value })} options={[{ value: 'mensagem', label: 'Mensagem' }, { value: 'email', label: 'E-mail' }, { value: 'ligacao', label: 'Ligação' }]} /></FormField>
          <FormField label="Mensagem" required><Textarea value={formFollowup.mensagem} onChange={e => setFormFollowup({ ...formFollowup, mensagem: e.target.value })} placeholder="Texto do followup..." rows={4} /></FormField>
          <FormField label="Agendar para"><Input type="datetime-local" value={formFollowup.agendado_para} onChange={e => setFormFollowup({ ...formFollowup, agendado_para: e.target.value })} /></FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvarFollowup} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      {/* Modal Template */}
      <Modal open={modalTemplate} onClose={() => setModalTemplate(false)} title={editandoTemplate ? 'Editar Template' : 'Novo Template'} size="md">
        <div className="space-y-4">
          <FormField label="Empresa" required><Select value={formTemplate.empresa_id} onChange={e => setFormTemplate({ ...formTemplate, empresa_id: e.target.value })} options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))} /></FormField>
          <FormField label="Nome" required><Input value={formTemplate.nome} onChange={e => setFormTemplate({ ...formTemplate, nome: e.target.value })} placeholder="Nome do template" /></FormField>
          <FormField label="Descrição"><Input value={formTemplate.descricao} onChange={e => setFormTemplate({ ...formTemplate, descricao: e.target.value })} placeholder="Descrição opcional" /></FormField>
          <FormField label="Mensagem" required><Textarea value={formTemplate.mensagem} onChange={e => setFormTemplate({ ...formTemplate, mensagem: e.target.value })} placeholder="Use {variavel} para variáveis dinâmicas..." rows={4} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Delay (minutos)"><Input type="number" value={formTemplate.delay_minutos} onChange={e => setFormTemplate({ ...formTemplate, delay_minutos: e.target.value })} /></FormField>
            <FormField label="Ordem"><Input type="number" value={formTemplate.ordem} onChange={e => setFormTemplate({ ...formTemplate, ordem: e.target.value })} /></FormField>
          </div>
          <Toggle checked={formTemplate.ativo} onChange={v => setFormTemplate({ ...formTemplate, ativo: v })} label="Template ativo" />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalTemplate(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvarTemplate} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarDelete}
        title="Excluir" message="Tem certeza que deseja excluir este item?" confirmLabel="Excluir" />
    </div>
  )
}
