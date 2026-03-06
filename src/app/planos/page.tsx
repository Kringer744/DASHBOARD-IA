'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { CreditCard, Plus, Edit2, Trash2, Star, ExternalLink } from 'lucide-react'
import { getPlanos, getEmpresas, criar, atualizar, deletar } from '@/lib/nocodb'
import type { Plano, Empresa } from '@/types'
import { formatarMoeda, formatarDataRelativa } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plano | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    empresa_id: '', nome: '', descricao: '', valor: '',
    valor_promocional: '', link_venda: '',
    ativo: true, ordem: '1',
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const data = await getPlanos(empresaId, { limit: 100 })
      setPlanos(data.list as Plano[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [empresaFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])
  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({ empresa_id: empresas[0]?.id?.toString() || '', nome: '', descricao: '', valor: '', valor_promocional: '', link_venda: '', ativo: true, ordem: '1' })
    setModalAberto(true)
  }

  function abrirEditar(p: Plano) {
    setEditando(p)
    setForm({
      empresa_id: p.empresa_id?.toString() || '',
      nome: p.nome || '',
      descricao: p.descricao || '',
      valor: p.valor?.toString() || '',
      valor_promocional: p.valor_promocional?.toString() || '',
      link_venda: p.link_venda || '',
      ativo: p.ativo ?? true,
      ordem: p.ordem?.toString() || '1',
    })
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const dados = {
        ...form,
        empresa_id: parseInt(form.empresa_id),
        valor: parseFloat(form.valor),
        valor_promocional: form.valor_promocional ? parseFloat(form.valor_promocional) : null,
        ordem: parseInt(form.ordem),
      }
      if (editando) await atualizar('planos', editando.id, dados)
      else await criar('planos', dados)
      setModalAberto(false)
      carregar()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    await deletar('planos', confirmDelete.id)
    setConfirmDelete(null)
    carregar()
  }

  const getEmpresaNome = (id: number) => empresas.find(e => e.id === id)?.nome_fantasia || `Empresa #${id}`

  // Agrupar por empresa
  const planosPorEmpresa = planos.reduce<Record<number, { empresa: Empresa | undefined, planos: Plano[] }>>((acc, p) => {
    if (!acc[p.empresa_id]) {
      acc[p.empresa_id] = { empresa: empresas.find(e => e.id === p.empresa_id), planos: [] }
    }
    acc[p.empresa_id].planos.push(p)
    return acc
  }, {})

  if (loading) return <PageLoading text="Carregando planos..." />

  return (
    <div className="animate-fade">
      <Header
        title="Planos"
        subtitle="Planos e produtos ofertados por empresa/unidade"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo Plano
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filtro */}
        <div className="flex items-center gap-3">
          <select value={empresaFiltro} onChange={e => setEmpresaFiltro(e.target.value)}
            className="input-field py-2 text-sm w-auto min-w-44">
            <option value="">Todas as empresas</option>
            {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
          </select>
          <span className="text-sm text-gray-400">{planos.length} planos</span>
        </div>

        {planos.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={CreditCard}
              title="Nenhum plano cadastrado"
              description="Cadastre os planos e produtos para que a IA possa informar os leads"
              action={<button onClick={abrirNovo} className="btn-primary">Criar Plano</button>}
            />
          </div>
        ) : (
          Object.entries(planosPorEmpresa).map(([empresaId, { empresa, planos: ePlanos }]) => (
            <div key={empresaId}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                {empresa?.nome_fantasia || empresa?.nome || `Empresa #${empresaId}`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ePlanos.map(plano => (
                  <div key={plano.id} className={cn(
                    'card p-5 relative',
                    !plano.ativo && 'opacity-60'
                  )}>
                    {/* Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={plano.ativo ? 'success' : 'default'}>
                        {plano.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex gap-1">
                        <button onClick={() => abrirEditar(plano)} className="p-1 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirmDelete(plano)} className="p-1 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Nome */}
                    <h4 className="font-bold text-white text-lg mb-1">{plano.nome}</h4>
                    {plano.descricao && <p className="text-sm text-gray-400 mb-4">{plano.descricao}</p>}

                    {/* Preço */}
                    <div className="mb-4">
                      {plano.valor_promocional ? (
                        <div>
                          <p className="text-xs text-gray-500 line-through">{formatarMoeda(plano.valor)}</p>
                          <p className="text-2xl font-bold text-accent-green">{formatarMoeda(plano.valor_promocional)}</p>
                          <Badge variant="warning">Promoção</Badge>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-white">{formatarMoeda(plano.valor)}</p>
                      )}
                    </div>

                    {/* Diferenciais */}
                    {plano.diferenciais && Array.isArray(plano.diferenciais) && plano.diferenciais.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {plano.diferenciais.slice(0, 4).map((d, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                            <Star className="w-3 h-3 text-accent-yellow flex-shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Link */}
                    {plano.link_venda && (
                      <a href={plano.link_venda} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Ver página de vendas
                      </a>
                    )}

                    <p className="text-xs text-gray-600 mt-3">{formatarDataRelativa(plano.updated_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={editando ? 'Editar Plano' : 'Novo Plano'} size="md">
        <div className="space-y-4">
          <FormField label="Empresa" required>
            <Select value={form.empresa_id} onChange={e => setForm({ ...form, empresa_id: e.target.value })}
              options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))} />
          </FormField>
          <FormField label="Nome do Plano" required>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Plano Mensal" />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o plano..." rows={3} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor (R$)" required>
              <Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="99.90" />
            </FormField>
            <FormField label="Valor Promocional">
              <Input type="number" value={form.valor_promocional} onChange={e => setForm({ ...form, valor_promocional: e.target.value })} placeholder="79.90" />
            </FormField>
          </div>
          <FormField label="Link de Venda">
            <Input value={form.link_venda} onChange={e => setForm({ ...form, link_venda: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Ordem">
            <Input type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: e.target.value })} />
          </FormField>
          <Toggle checked={form.ativo} onChange={v => setForm({ ...form, ativo: v })} label="Plano ativo" />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarDelete}
        title="Excluir Plano" message={`Excluir "${confirmDelete?.nome}"?`} confirmLabel="Excluir" />
    </div>
  )
}
