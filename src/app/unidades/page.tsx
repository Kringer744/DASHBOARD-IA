'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { FormField, Input, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Plus, Edit2, Trash2, Search, Phone, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { getUnidades, getEmpresas, criarUnidade, atualizarUnidade, deletarUnidade } from '@/lib/nocodb'
import type { Unidade, Empresa } from '@/types'
import { formatarDataRelativa } from '@/lib/utils'

const PAGE_SIZE = 15
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Unidade | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Unidade | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [expandido, setExpandido] = useState<number | null>(null)

  const [form, setForm] = useState({
    empresa_id: '', nome: '', nome_abreviado: '', codigo: '',
    cidade: '', estado: 'SP', cep: '', endereco: '', numero: '',
    telefone_principal: '', whatsapp: '', email_contato: '',
    instagram: '', facebook: '', site: '',
    link_matricula: '', link_agendamento: '',
    ativa: true, ordem_exibicao: '1',
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const where = busca ? `(nome,like,%${busca}%)~or(cidade,like,%${busca}%)` : undefined
      const data = await getUnidades(empresaId, { page, limit: PAGE_SIZE, where })
      setUnidades(data.list as Unidade[])
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
      nome: '', nome_abreviado: '', codigo: '',
      cidade: '', estado: 'SP', cep: '', endereco: '', numero: '',
      telefone_principal: '', whatsapp: '', email_contato: '',
      instagram: '', facebook: '', site: '',
      link_matricula: '', link_agendamento: '',
      ativa: true, ordem_exibicao: '1',
    })
    setModalAberto(true)
  }

  function abrirEditar(u: Unidade) {
    setEditando(u)
    setForm({
      empresa_id: u.empresa_id?.toString() || '',
      nome: u.nome || '', nome_abreviado: u.nome_abreviado || '',
      codigo: u.codigo || '', cidade: u.cidade || '', estado: u.estado || 'SP',
      cep: u.cep || '', endereco: u.endereco || '', numero: u.numero || '',
      telefone_principal: u.telefone_principal || '', whatsapp: u.whatsapp || '',
      email_contato: u.email_contato || '', instagram: u.instagram || '',
      facebook: u.facebook || '', site: u.site || '',
      link_matricula: u.link_matricula || '', link_agendamento: u.link_agendamento || '',
      ativa: u.ativa ?? true, ordem_exibicao: u.ordem_exibicao?.toString() || '1',
    })
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const dados = { ...form, empresa_id: parseInt(form.empresa_id), ordem_exibicao: parseInt(form.ordem_exibicao) }
      if (editando) await atualizarUnidade(editando.id, dados)
      else await criarUnidade(dados)
      setModalAberto(false)
      carregar()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    setDeletando(true)
    try { await deletarUnidade(confirmDelete.id); setConfirmDelete(null); carregar() }
    catch (e) { console.error(e) }
    finally { setDeletando(false) }
  }

  const getEmpresaNome = (id: number) => empresas.find(e => e.id === id)?.nome_fantasia || `Empresa #${id}`

  return (
    <div className="animate-fade">
      <Header
        title="Unidades"
        subtitle="Filiais e unidades por empresa"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Unidade
          </button>
        }
      />

      <div className="p-6">
        <div className="card">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Buscar unidade..." value={busca}
                onChange={(e) => { setBusca(e.target.value); setPage(1) }}
                className="input-field pl-10 py-2 text-sm" />
            </div>
            <select value={empresaFiltro} onChange={(e) => { setEmpresaFiltro(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-auto min-w-44">
              <option value="">Todas as empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
            </select>
          </div>

          {loading ? <TableSkeleton rows={8} /> : unidades.length === 0 ? (
            <EmptyState icon={MapPin} title="Nenhuma unidade" description="Crie unidades para cada empresa"
              action={<button onClick={abrirNovo} className="btn-primary">Criar Unidade</button>} />
          ) : (
            <>
              <div className="divide-y divide-bg-border/50">
                {unidades.map(u => (
                  <div key={u.id}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{u.nome}</p>
                          {u.codigo && <span className="text-xs text-gray-500 font-mono">#{u.codigo}</span>}
                          <Badge variant={u.ativa ? 'success' : 'default'}>{u.ativa ? 'Ativa' : 'Inativa'}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{getEmpresaNome(u.empresa_id)} · {u.cidade}/{u.estado}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
                        {u.telefone_principal && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{u.telefone_principal}</span>}
                        {u.site && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Site</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirEditar(u)} className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(u)} className="p-1.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => setExpandido(expandido === u.id ? null : u.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors">
                          {expandido === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {expandido === u.id && (
                      <div className="px-5 pb-4 pt-0 bg-bg-secondary/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {u.endereco && <div><p className="text-xs text-gray-500">Endereço</p><p className="text-gray-300">{u.endereco}, {u.numero} - {u.bairro}</p></div>}
                          {u.whatsapp && <div><p className="text-xs text-gray-500">WhatsApp</p><p className="text-gray-300">{u.whatsapp}</p></div>}
                          {u.email_contato && <div><p className="text-xs text-gray-500">E-mail</p><p className="text-gray-300">{u.email_contato}</p></div>}
                          {u.link_matricula && <div><p className="text-xs text-gray-500">Link Matrícula</p><a href={u.link_matricula} target="_blank" className="text-brand-400 hover:underline">Acessar →</a></div>}
                          {u.instagram && <div><p className="text-xs text-gray-500">Instagram</p><p className="text-gray-300">{u.instagram}</p></div>}
                          <div><p className="text-xs text-gray-500">Criada</p><p className="text-gray-300">{formatarDataRelativa(u.created_at)}</p></div>
                        </div>
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

      {/* Modal */}
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={editando ? 'Editar Unidade' : 'Nova Unidade'} size="xl">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Empresa" required className="col-span-2">
            <Select value={form.empresa_id} onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
              options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))} />
          </FormField>
          <FormField label="Nome da Unidade" required className="col-span-2">
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Smart Fit - Paulista" />
          </FormField>
          <FormField label="Nome Abreviado">
            <Input value={form.nome_abreviado} onChange={(e) => setForm({ ...form, nome_abreviado: e.target.value })} placeholder="Paulista" />
          </FormField>
          <FormField label="Código">
            <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="UN001" />
          </FormField>
          <FormField label="Cidade">
            <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="São Paulo" />
          </FormField>
          <FormField label="Estado">
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
              options={ESTADOS.map(e => ({ value: e, label: e }))} />
          </FormField>
          <FormField label="Endereço">
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Av. Paulista" />
          </FormField>
          <FormField label="Número">
            <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="1234" />
          </FormField>
          <FormField label="CEP">
            <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="01310-100" />
          </FormField>
          <FormField label="Telefone">
            <Input value={form.telefone_principal} onChange={(e) => setForm({ ...form, telefone_principal: e.target.value })} placeholder="(11) 99999-9999" />
          </FormField>
          <FormField label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" />
          </FormField>
          <FormField label="E-mail">
            <Input value={form.email_contato} onChange={(e) => setForm({ ...form, email_contato: e.target.value })} placeholder="unidade@empresa.com" />
          </FormField>
          <FormField label="Instagram">
            <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@empresa" />
          </FormField>
          <FormField label="Site">
            <Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Link Matrícula">
            <Input value={form.link_matricula} onChange={(e) => setForm({ ...form, link_matricula: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Link Agendamento">
            <Input value={form.link_agendamento} onChange={(e) => setForm({ ...form, link_agendamento: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Ordem">
            <Input type="number" value={form.ordem_exibicao} onChange={(e) => setForm({ ...form, ordem_exibicao: e.target.value })} />
          </FormField>
          <div className="col-span-2 pt-2">
            <Toggle checked={form.ativa} onChange={(v) => setForm({ ...form, ativa: v })} label="Unidade ativa" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar Unidade'}
          </button>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarDelete}
        title="Excluir Unidade" message={`Excluir "${confirmDelete?.nome}"?`} confirmLabel="Excluir" loading={deletando} />
    </div>
  )
}
