'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StatusBadge, PlanoBadge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading, TableSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { FormField, Input, Select, Toggle } from '@/components/ui/FormField'
import {
  Building2, Plus, Edit2, Trash2, Search,
  MessageSquare, BookOpen, Users, CreditCard
} from 'lucide-react'
import {
  getEmpresas, criarEmpresa, atualizarEmpresa, deletar
} from '@/lib/nocodb'
import type { Empresa } from '@/types'
import { formatarDataRelativa, getIniciais, gerarCorAvatar } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Empresa | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Empresa | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basic',
    status: 'active',
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const where = busca
        ? `(nome,like,%${busca}%)~or(nome_fantasia,like,%${busca}%)`
        : undefined
      const data = await getEmpresas({ page, limit: PAGE_SIZE, where })
      setEmpresas(data.list as Empresa[])
      setTotalRows(data.pageInfo.totalRows)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, busca])

  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', nome_fantasia: '', cnpj: '', email: '', telefone: '', plano: 'basic', status: 'active' })
    setModalAberto(true)
  }

  function abrirEditar(empresa: Empresa) {
    setEditando(empresa)
    setForm({
      nome: empresa.nome || '',
      nome_fantasia: empresa.nome_fantasia || '',
      cnpj: empresa.cnpj || '',
      email: empresa.email || '',
      telefone: empresa.telefone || '',
      plano: empresa.plano || 'basic',
      status: empresa.status || 'active',
    })
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await atualizarEmpresa(editando.id, form)
      } else {
        await criarEmpresa(form)
      }
      setModalAberto(false)
      carregar()
    } catch (e) {
      console.error(e)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    setDeletando(true)
    try {
      await deletar('empresas', confirmDelete.id)
      setConfirmDelete(null)
      carregar()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletando(false)
    }
  }

  const stats = {
    total: totalRows,
    ativas: empresas.filter(e => e.status === 'active').length,
    enterprise: empresas.filter(e => e.plano === 'enterprise').length,
    conversas: empresas.reduce((acc, e) => acc + (e.conversas || 0), 0),
  }

  return (
    <div className="animate-fade">
      <Header
        title="Empresas"
        subtitle="Gerenciar clientes do sistema"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total" value={totalRows} icon={Building2} color="purple" loading={loading} />
          <MetricCard title="Ativas" value={stats.ativas} icon={Users} color="green" loading={loading} />
          <MetricCard title="Enterprise" value={stats.enterprise} icon={CreditCard} color="yellow" loading={loading} />
          <MetricCard title="Conversas" value={stats.conversas} icon={MessageSquare} color="blue" loading={loading} />
        </div>

        {/* Tabela */}
        <div className="card">
          {/* Filtros */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPage(1) }}
                className="input-field pl-10 py-2 text-sm"
              />
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <TableSkeleton rows={8} />
          ) : empresas.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma empresa encontrada"
              description={busca ? 'Tente outra busca' : 'Clique em "Nova Empresa" para começar'}
              action={!busca ? <button onClick={abrirNovo} className="btn-primary">Criar Empresa</button> : undefined}
            />
          ) : (
            <>
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr className="text-left">
                      <th className="table-header">Empresa</th>
                      <th className="table-header">CNPJ</th>
                      <th className="table-header">Contato</th>
                      <th className="table-header">Plano</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Conversas</th>
                      <th className="table-header">Cadastro</th>
                      <th className="table-header w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
                      <tr key={empresa.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                              gerarCorAvatar(empresa.nome)
                            )}>
                              <span className="text-xs font-bold text-white">
                                {getIniciais(empresa.nome_fantasia || empresa.nome)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{empresa.nome_fantasia || empresa.nome}</p>
                              <p className="text-xs text-gray-400">{empresa.nome}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-sm font-mono">{empresa.cnpj || '-'}</td>
                        <td className="table-cell">
                          <p className="text-sm">{empresa.email || '-'}</p>
                          <p className="text-xs text-gray-400">{empresa.telefone || ''}</p>
                        </td>
                        <td className="table-cell"><PlanoBadge plano={empresa.plano} /></td>
                        <td className="table-cell"><StatusBadge status={empresa.status} /></td>
                        <td className="table-cell text-sm">{empresa.conversas ?? 0}</td>
                        <td className="table-cell text-sm text-gray-400">{formatarDataRelativa(empresa.created_at)}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => abrirEditar(empresa)}
                              className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(empresa)}
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
              <Pagination
                page={page}
                totalRows={totalRows}
                pageSize={PAGE_SIZE}
                onChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Empresa' : 'Nova Empresa'}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Razão Social" required className="sm:col-span-2">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Empresa Ltda"
            />
          </FormField>
          <FormField label="Nome Fantasia">
            <Input
              value={form.nome_fantasia}
              onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
              placeholder="Ex: Marca"
            />
          </FormField>
          <FormField label="CNPJ">
            <Input
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
            />
          </FormField>
          <FormField label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contato@empresa.com"
            />
          </FormField>
          <FormField label="Telefone">
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField label="Plano">
            <Select
              value={form.plano}
              onChange={(e) => setForm({ ...form, plano: e.target.value })}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'basic', label: 'Basic' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' },
                { value: 'suspended', label: 'Suspenso' },
              ]}
            />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar Empresa'}
          </button>
        </div>
      </Modal>

      {/* Modal Confirmar Delete */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarDelete}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir "${confirmDelete?.nome_fantasia || confirmDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deletando}
      />
    </div>
  )
}
