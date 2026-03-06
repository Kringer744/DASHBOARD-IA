'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField, Input, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { Plug, Plus, Edit2, Trash2, Webhook, MessageCircle, Mail, Globe, Settings } from 'lucide-react'
import { getIntegracoes, getEmpresas, criarIntegracao, atualizarIntegracao, deletar } from '@/lib/nocodb'
import type { Integracao, Empresa } from '@/types'
import { formatarDataRelativa } from '@/lib/utils'

const TIPOS_INTEGRACAO = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-accent-green' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-brand-400' },
  { value: 'email', label: 'E-mail', icon: Mail, color: 'text-accent-blue' },
  { value: 'crm', label: 'CRM', icon: Settings, color: 'text-accent-yellow' },
  { value: 'website', label: 'Website', icon: Globe, color: 'text-accent-cyan' },
]

export default function IntegracoesPage() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Integracao | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Integracao | null>(null)
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    empresa_id: '', tipo: 'whatsapp', ativo: true,
    config: {
      api_key: '', api_url: '', phone_number: '', instance_name: '',
      webhook_url: '', secret: '',
    }
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const empresaId = empresaFiltro ? parseInt(empresaFiltro) : undefined
      const data = await getIntegracoes(empresaId, { limit: 50 })
      setIntegracoes(data.list as Integracao[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [empresaFiltro])

  useEffect(() => {
    getEmpresas({ limit: 100 }).then(d => setEmpresas(d.list as Empresa[]))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({ empresa_id: empresas[0]?.id?.toString() || '', tipo: 'whatsapp', ativo: true, config: { api_key: '', api_url: '', phone_number: '', instance_name: '', webhook_url: '', secret: '' } })
    setModalAberto(true)
  }

  function abrirEditar(integ: Integracao) {
    setEditando(integ)
    const c = (integ.config as Record<string, string>) || {}
    setForm({
      empresa_id: integ.empresa_id?.toString() || '',
      tipo: integ.tipo || 'whatsapp',
      ativo: integ.ativo ?? true,
      config: {
        api_key: c.api_key || '',
        api_url: c.api_url || '',
        phone_number: c.phone_number || '',
        instance_name: c.instance_name || '',
        webhook_url: c.webhook_url || '',
        secret: c.secret || '',
      }
    })
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const dados = { ...form, empresa_id: parseInt(form.empresa_id) }
      if (editando) await atualizarIntegracao(editando.id, dados)
      else await criarIntegracao(dados)
      setModalAberto(false)
      carregar()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    await deletar('integracoes', confirmDelete.id)
    setConfirmDelete(null)
    carregar()
  }

  const getEmpresaNome = (id: number) => empresas.find(e => e.id === id)?.nome_fantasia || `Empresa #${id}`
  const getTipoConfig = (tipo: string) => TIPOS_INTEGRACAO.find(t => t.value === tipo)

  const ativas = integracoes.filter(i => i.ativo).length

  return (
    <div className="animate-fade">
      <Header
        title="Integrações"
        subtitle="Conecte o sistema com serviços externos"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Integração
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{integracoes.length}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{ativas}</p>
              <p className="text-xs text-gray-400">Ativas</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-accent-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{integracoes.length - ativas}</p>
              <p className="text-xs text-gray-400">Inativas</p>
            </div>
          </div>
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-3">
          <select value={empresaFiltro} onChange={e => setEmpresaFiltro(e.target.value)}
            className="input-field py-2 text-sm w-auto min-w-44">
            <option value="">Todas as empresas</option>
            {empresas.map(e => <option key={e.id} value={e.id.toString()}>{e.nome_fantasia || e.nome}</option>)}
          </select>
        </div>

        {/* Grid de integrações */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 h-32 animate-pulse bg-bg-card" />
            ))}
          </div>
        ) : integracoes.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Plug}
              title="Nenhuma integração configurada"
              description="Conecte WhatsApp, webhooks e outros serviços externos"
              action={<button onClick={abrirNovo} className="btn-primary">Adicionar Integração</button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {integracoes.map(integ => {
              const tipoConfig = getTipoConfig(integ.tipo)
              const Icon = tipoConfig?.icon || Plug
              const config = (integ.config as Record<string, string>) || {}
              return (
                <div key={integ.id} className="card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${tipoConfig?.color || 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white capitalize">{integ.tipo}</p>
                        <p className="text-xs text-gray-400">{getEmpresaNome(integ.empresa_id)}</p>
                      </div>
                    </div>
                    <Badge variant={integ.ativo ? 'success' : 'default'}>
                      {integ.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  {/* Config snippet */}
                  <div className="bg-bg-secondary rounded-lg p-3 text-xs font-mono text-gray-400 mb-4 space-y-1">
                    {config.api_url && <p>URL: {config.api_url.substring(0, 30)}...</p>}
                    {config.phone_number && <p>Phone: {config.phone_number}</p>}
                    {config.instance_name && <p>Instance: {config.instance_name}</p>}
                    {config.webhook_url && <p>Webhook: {config.webhook_url.substring(0, 30)}...</p>}
                    {!config.api_url && !config.phone_number && !config.webhook_url && <p>Configurado</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatarDataRelativa(integ.updated_at)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEditar(integ)} className="p-1.5 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(integ)} className="p-1.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={editando ? 'Editar Integração' : 'Nova Integração'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Empresa" required>
              <Select value={form.empresa_id} onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))} />
            </FormField>
            <FormField label="Tipo de Integração" required>
              <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                options={TIPOS_INTEGRACAO.map(t => ({ value: t.value, label: t.label }))} />
            </FormField>
          </div>

          <div className="border-t border-bg-border pt-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Configurações</p>
            <div className="space-y-3">
              {(form.tipo === 'whatsapp') && (
                <>
                  <FormField label="URL da API"><Input value={form.config.api_url} onChange={e => setForm({ ...form, config: { ...form.config, api_url: e.target.value } })} placeholder="https://api.whatsapp.com/..." /></FormField>
                  <FormField label="Número do Telefone"><Input value={form.config.phone_number} onChange={e => setForm({ ...form, config: { ...form.config, phone_number: e.target.value } })} placeholder="+55 11 99999-9999" /></FormField>
                  <FormField label="Nome da Instância"><Input value={form.config.instance_name} onChange={e => setForm({ ...form, config: { ...form.config, instance_name: e.target.value } })} placeholder="instancia-01" /></FormField>
                  <FormField label="API Key"><Input value={form.config.api_key} onChange={e => setForm({ ...form, config: { ...form.config, api_key: e.target.value } })} placeholder="Bearer token..." type="password" /></FormField>
                </>
              )}
              {(form.tipo === 'webhook') && (
                <>
                  <FormField label="URL do Webhook"><Input value={form.config.webhook_url} onChange={e => setForm({ ...form, config: { ...form.config, webhook_url: e.target.value } })} placeholder="https://meu-site.com/webhook" /></FormField>
                  <FormField label="Secret"><Input value={form.config.secret} onChange={e => setForm({ ...form, config: { ...form.config, secret: e.target.value } })} placeholder="chave-secreta" type="password" /></FormField>
                </>
              )}
              {(form.tipo === 'email' || form.tipo === 'crm') && (
                <>
                  <FormField label="URL da API"><Input value={form.config.api_url} onChange={e => setForm({ ...form, config: { ...form.config, api_url: e.target.value } })} placeholder="https://api.servico.com" /></FormField>
                  <FormField label="API Key"><Input value={form.config.api_key} onChange={e => setForm({ ...form, config: { ...form.config, api_key: e.target.value } })} placeholder="sk-..." type="password" /></FormField>
                </>
              )}
              {form.tipo === 'website' && (
                <FormField label="URL do Website">
                  <Input value={form.config.api_url} onChange={e => setForm({ ...form, config: { ...form.config, api_url: e.target.value } })} placeholder="https://meusite.com" />
                </FormField>
              )}
            </div>
          </div>

          <Toggle checked={form.ativo} onChange={v => setForm({ ...form, ativo: v })} label="Integração ativa" />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarDelete}
        title="Excluir Integração" message={`Excluir integração "${confirmDelete?.tipo}"?`} confirmLabel="Excluir" />
    </div>
  )
}
