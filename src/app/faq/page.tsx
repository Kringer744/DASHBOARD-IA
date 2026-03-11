'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import {
  BookOpen, Plus, Edit2, Trash2, Search, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react'
import {
  getFAQs, getEmpresas, criarFAQ, atualizarFAQ, deletarFAQ
} from '@/lib/nocodb'
import type { FAQ, Empresa } from '@/types'
import { formatarDataRelativa, truncarTexto } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<FAQ | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<FAQ | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [visualizando, setVisualizando] = useState<FAQ | null>(null)

  const [form, setForm] = useState({
    empresa_id: '',
    categoria: '',
    pergunta: '',
    resposta: '',
    prioridade: '5',
    idioma: 'pt-BR',
    tags: '',
    ativo: true,
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const where = busca
        ? `(pergunta,like,%${busca}%)~or(resposta,like,%${busca}%)`
        : undefined
      const data = await getFAQs(empresaId, { page, limit: PAGE_SIZE, where })
      setFaqs(data.list as FAQ[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, busca, empresaFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({
      empresa_id: empresaFiltro || empresas[0]?.id?.toString() || '',
      categoria: '',
      pergunta: '',
      resposta: '',
      prioridade: '5',
      idioma: 'pt-BR',
      tags: '',
      ativo: true,
    })
    setModalAberto(true)
  }

  function abrirEditar(faq: FAQ) {
    setEditando(faq)
    setForm({
      empresa_id: faq.empresa_id?.toString() || '',
      categoria: faq.categoria || '',
      pergunta: faq.pergunta || '',
      resposta: faq.resposta || '',
      prioridade: faq.prioridade?.toString() || '5',
      idioma: faq.idioma || 'pt-BR',
      tags: Array.isArray(faq.tags) ? faq.tags.join(', ') : '',
      ativo: faq.ativo ?? true,
    })
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const dados = {
        ...form,
        empresa_id: parseInt(form.empresa_id),
        prioridade: parseInt(form.prioridade),
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      if (editando) {
        await atualizarFAQ(editando.id, dados)
      } else {
        await criarFAQ(dados)
      }
      setModalAberto(false)
      carregar()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    setDeletando(true)
    try {
      await deletarFAQ(confirmDelete.id)
      setConfirmDelete(null)
      carregar()
    } catch (e) { console.error(e) }
    finally { setDeletando(false) }
  }

  const getEmpresaNome = (id: number) => {
    const emp = empresas.find(e => e.id === id)
    return emp?.nome_fantasia || emp?.nome || `Empresa #${id}`
  }

  return (
    <div className="animate-fade">
      <Header
        title="Base de Conhecimento"
        subtitle="FAQs utilizados pela IA para responder usuários"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo FAQ
          </button>
        }
      />

      <div className="p-6">
        <div className="card">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar pergunta ou resposta..."
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
          </div>

          {loading ? (
            <TableSkeleton rows={10} />
          ) : faqs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Nenhum FAQ encontrado"
              description="Adicione perguntas frequentes para enriquecer a base de conhecimento da IA"
              action={<button onClick={abrirNovo} className="btn-primary">Criar FAQ</button>}
            />
          ) : (
            <>
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-header">Pergunta</th>
                      <th className="table-header">Empresa</th>
                      <th className="table-header">Categoria</th>
                      <th className="table-header">Prioridade</th>
                      <th className="table-header">Uso</th>
                      <th className="table-header">Feedback</th>
                      <th className="table-header">Status</th>
                      <th className="table-header w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id} className="table-row">
                        <td className="table-cell max-w-xs">
                          <p className="text-sm font-medium text-white">{truncarTexto(faq.pergunta, 60)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{truncarTexto(faq.resposta, 50)}</p>
                        </td>
                        <td className="table-cell text-sm">{getEmpresaNome(faq.empresa_id)}</td>
                        <td className="table-cell">
                          <Badge variant="purple">{faq.categoria || 'Geral'}</Badge>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            {'★'.repeat(Math.min(faq.prioridade || 1, 5))}
                            <span className="text-xs text-gray-400">({faq.prioridade})</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1 text-sm">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            {faq.vezes_utilizado ?? 0}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-accent-green">
                              <ThumbsUp className="w-3 h-3" />{faq.feedback_positivo ?? 0}
                            </span>
                            <span className="flex items-center gap-1 text-accent-red">
                              <ThumbsDown className="w-3 h-3" />{faq.feedback_negativo ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <Badge variant={faq.ativo ? 'success' : 'default'}>
                            {faq.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setVisualizando(faq)}
                              className="p-1.5 text-gray-400 hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirEditar(faq)}
                              className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(faq)}
                              className="p-1.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalRows={totalRows} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Modal Visualizar */}
      <Modal open={!!visualizando} onClose={() => setVisualizando(null)} title="Visualizar FAQ" size="lg">
        {visualizando && (
          <div className="space-y-4">
            <div>
              <p className="label">Pergunta</p>
              <p className="text-white">{visualizando.pergunta}</p>
            </div>
            <div>
              <p className="label">Resposta</p>
              <p className="text-gray-300 bg-bg-elevated p-4 rounded-xl">{visualizando.resposta}</p>
            </div>
            {visualizando.variacoes && (
              <div>
                <p className="label">Variações da pergunta</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(visualizando.variacoes) ? visualizando.variacoes : []).map((v, i) => (
                    <Badge key={i} variant="info">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 text-center pt-2">
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-accent-green">{visualizando.feedback_positivo}</p>
                <p className="text-xs text-gray-400 mt-1">Positivos</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-accent-red">{visualizando.feedback_negativo}</p>
                <p className="text-xs text-gray-400 mt-1">Negativos</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-brand-400">{visualizando.vezes_utilizado}</p>
                <p className="text-xs text-gray-400 mt-1">Utilizações</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Criar/Editar */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar FAQ' : 'Novo FAQ'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Empresa" required>
              <Select
                value={form.empresa_id}
                onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))}
              />
            </FormField>
            <FormField label="Categoria">
              <Input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ex: Preços, Horários, Serviços..."
              />
            </FormField>
          </div>
          <FormField label="Pergunta" required>
            <Input
              value={form.pergunta}
              onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
              placeholder="Qual é a pergunta que o usuário pode fazer?"
            />
          </FormField>
          <FormField label="Resposta" required>
            <Textarea
              value={form.resposta}
              onChange={(e) => setForm({ ...form, resposta: e.target.value })}
              placeholder="Qual é a resposta completa para esta pergunta?"
              rows={5}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={`Prioridade: ${form.prioridade}`}>
              <input
                type="range" min="1" max="10" value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                className="w-full accent-brand-500"
              />
            </FormField>
            <FormField label="Idioma">
              <Select
                value={form.idioma}
                onChange={(e) => setForm({ ...form, idioma: e.target.value })}
                options={[
                  { value: 'pt-BR', label: 'Português (BR)' },
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                ]}
              />
            </FormField>
          </div>
          <FormField label="Tags (separadas por vírgula)">
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="academia, musculação, horário..."
            />
          </FormField>
          <Toggle
            checked={form.ativo}
            onChange={(v) => setForm({ ...form, ativo: v })}
            label="FAQ ativo"
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar FAQ'}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarDelete}
        title="Excluir FAQ"
        message={`Tem certeza que deseja excluir este FAQ? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deletando}
      />
    </div>
  )
}
