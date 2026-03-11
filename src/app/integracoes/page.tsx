'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import Header from '@/components/layout/Header'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { PageLoading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField, Input, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import {
  Plug, Plus, Edit2, Trash2, Webhook, MessageCircle, Mail, Globe, Settings,
  Info, MessageSquareText, Loader2, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react'
import { getIntegracoes, getEmpresas, criarIntegracao, atualizarIntegracao, deletar } from '@/lib/nocodb'
import type { Integracao, Empresa } from '@/types'
import { formatarDataRelativa, cn } from '@/lib/utils'
import * as uazapi from '@/lib/uazapi'

const TIPOS_INTEGRACAO = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-accent-green' },
  { value: 'uazapi', label: 'Uazapi', icon: MessageCircle, color: 'text-accent-green' },
  { value: 'evo', label: 'W12 Evo', icon: MessageCircle, color: 'text-brand-400' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-brand-400' },
  { value: 'email', label: 'E-mail', icon: Mail, color: 'text-accent-blue' },
  { value: 'chatwoot', label: 'Chatwoot', icon: MessageSquareText, color: 'text-accent-cyan' },
  { value: 'crm', label: 'CRM', icon: Settings, color: 'text-accent-yellow' },
  { value: 'website', label: 'Website', icon: Globe, color: 'text-accent-cyan' },
]

interface ChatwootConfig {
  enabled: boolean
  url: string
  access_token: string
  account_id: number
  inbox_id: number
  ignore_groups: boolean
  sign_messages: boolean
  create_new_conversation: boolean
}

const CHATWOOT_DEFAULT: ChatwootConfig = {
  enabled: false,
  url: '',
  access_token: '',
  account_id: 1,
  inbox_id: 1,
  ignore_groups: true,
  sign_messages: true,
  create_new_conversation: false,
}

export default function IntegracoesPage() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Integracao | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Integracao | null>(null)
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Chatwoot config
  const [chatwootModal, setChatwootModal] = useState(false)
  const [chatwootInteg, setChatwootInteg] = useState<Integracao | null>(null)
  const [chatwootForm, setChatwootForm] = useState<ChatwootConfig>(CHATWOOT_DEFAULT)
  const [chatwootLoading, setChatwootLoading] = useState(false)
  const [chatwootSalvando, setChatwootSalvando] = useState(false)
  const [chatwootErro, setChatwootErro] = useState('')
  const [chatwootSucesso, setChatwootSucesso] = useState('')

  // Uazapi state
  const [uazapiModal, setUazapiModal] = useState(false)
  const [uazapiInteg, setUazapiInteg] = useState<Integracao | null>(null)
  const [uazapiQR, setUazapiQR] = useState('')
  const [uazapiStatus, setUazapiStatus] = useState<string>('unknown')
  const [uazapiLoading, setUazapiLoading] = useState(false)
  const [uazapiError, setUazapiError] = useState('')

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

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (uazapiModal && uazapiStatus === 'connecting' && uazapiInteg) {
      interval = setInterval(() => {
        const token = (uazapiInteg.config as Record<string, string>)?.api_key
        if (token) atualizarStatusUazapi(token)
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [uazapiModal, uazapiStatus, uazapiInteg])

  function abrirNovo() {
    setEditando(null)
    setErro('')
    setForm({ empresa_id: empresas[0]?.id?.toString() || '', tipo: 'whatsapp', ativo: true, config: { api_key: '', api_url: '', phone_number: '', instance_name: '', webhook_url: '', secret: '' } })
    setModalAberto(true)
  }

  function abrirEditar(integ: Integracao) {
    setEditando(integ)
    setErro('')
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
    setErro('')
    if (['whatsapp', 'uazapi'].includes(form.tipo) && !editando) {
      const whatsappExistente = integracoes.find(
        i => ['whatsapp', 'uazapi'].includes(i.tipo) && i.empresa_id === parseInt(form.empresa_id)
      )
      if (whatsappExistente) {
        setErro('Esta empresa já possui uma instância de WhatsApp conectada. Edite a existente ou remova antes de criar uma nova.')
        return
      }
    }
    if (['whatsapp', 'uazapi'].includes(form.tipo) && editando) {
      const whatsappExistente = integracoes.find(
        i => ['whatsapp', 'uazapi'].includes(i.tipo) && i.empresa_id === parseInt(form.empresa_id) && i.id !== editando.id
      )
      if (whatsappExistente) {
        setErro('Esta empresa já possui outra instância de WhatsApp. Cada empresa pode ter somente 1 instância.')
        return
      }
    }
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

  // ==========================================
  // CHATWOOT CONFIG (GET/PUT via UAZAPI)
  // ==========================================

  async function abrirChatwoot(integ: Integracao) {
    const c = (integ.config as Record<string, string>) || {}
    if (!c.api_url || !c.api_key) {
      setChatwootErro('Configure a URL da API e o Token na integração WhatsApp antes de configurar o Chatwoot.')
      setChatwootInteg(integ)
      setChatwootForm(CHATWOOT_DEFAULT)
      setChatwootModal(true)
      return
    }

    setChatwootInteg(integ)
    setChatwootErro('')
    setChatwootSucesso('')
    setChatwootLoading(true)
    setChatwootModal(true)

    try {
      const baseUrl = c.api_url.replace(/\/$/, '')
      const res = await axios.get(`${baseUrl}/chatwoot/config`, {
        headers: {
          'Accept': 'application/json',
          'token': c.api_key,
        },
        timeout: 15000,
      })

      const data = res.data
      setChatwootForm({
        enabled: data.enabled ?? false,
        url: data.url || '',
        access_token: data.access_token || '',
        account_id: data.account_id ?? 1,
        inbox_id: data.inbox_id ?? 1,
        ignore_groups: data.ignore_groups ?? true,
        sign_messages: data.sign_messages ?? true,
        create_new_conversation: data.create_new_conversation ?? false,
      })
    } catch (error) {
      const err = error as { response?: { status?: number }; message?: string }
      if (err.response?.status === 404) {
        setChatwootErro('Endpoint Chatwoot não encontrado nesta instância UAZAPI.')
      } else {
        setChatwootErro(`Não foi possível carregar a config atual. ${err.message || 'Verifique a conexão.'}`)
      }
      setChatwootForm(CHATWOOT_DEFAULT)
    } finally {
      setChatwootLoading(false)
    }
  }

  async function salvarChatwoot() {
    if (!chatwootInteg) return
    const c = (chatwootInteg.config as Record<string, string>) || {}
    if (!c.api_url || !c.api_key) {
      setChatwootErro('URL da API ou Token não configurados.')
      return
    }

    if (chatwootForm.enabled && !chatwootForm.url) {
      setChatwootErro('Informe a URL do Chatwoot.')
      return
    }
    if (chatwootForm.enabled && !chatwootForm.access_token) {
      setChatwootErro('Informe o Access Token do Chatwoot.')
      return
    }

    setChatwootSalvando(true)
    setChatwootErro('')
    setChatwootSucesso('')

    try {
      const baseUrl = c.api_url.replace(/\/$/, '')
      await axios.put(`${baseUrl}/chatwoot/config`, chatwootForm, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': c.api_key,
        },
        timeout: 15000,
      })
      setChatwootSucesso('Configuração do Chatwoot salva com sucesso!')
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
      setChatwootErro(
        err.response?.data?.message ||
        err.message ||
        'Erro ao salvar configuração. Verifique os dados e tente novamente.'
      )
    } finally {
      setChatwootSalvando(false)
    }
  }

  async function recarregarChatwoot() {
    if (chatwootInteg) {
      setChatwootSucesso('')
      setChatwootErro('')
      await abrirChatwoot(chatwootInteg)
    }
  }

  // ==========================================
  // UAZAPI INSTANCE MANAGEMENT
  // ==========================================

  async function abrirUazapi(integ: Integracao) {
    setUazapiInteg(integ)
    setUazapiModal(true)
    setUazapiQR('')
    setUazapiStatus('loading')
    setUazapiError('')

    const config = (integ.config as Record<string, string>) || {}
    if (!config.api_key) {
      setUazapiStatus('error')
      setUazapiError('Token da instância não configurado. Por favor, preencha as configurações da integração primeiro.')
      return
    }

    await atualizarStatusUazapi(config.api_key)
  }

  async function atualizarStatusUazapi(token: string) {
    setUazapiLoading(true)
    try {
      const data = await uazapi.getInstanceStatus(token)
      setUazapiStatus(data.state || 'disconnected')
      if (data.qrcode) {
        setUazapiQR(data.qrcode)
      }
    } catch (error) {
      console.error(error)
      setUazapiStatus('error')
      setUazapiError('Não foi possível conectar à Uazapi para verificar o status.')
    } finally {
      setUazapiLoading(false)
    }
  }

  async function gerarNovoQRCode() {
    if (!uazapiInteg) return
    const token = (uazapiInteg.config as Record<string, string>)?.api_key
    if (!token) return

    setUazapiLoading(true)
    setUazapiError('')
    try {
      const data = await uazapi.getQRCode(token)
      if (data.qrcode) {
        setUazapiQR(data.qrcode)
        setUazapiStatus('connecting')
      } else {
        setUazapiError('A instância já pode estar conectada ou o QR Code não foi gerado.')
      }
    } catch (error) {
      console.error(error)
      setUazapiError('Erro ao gerar QR Code.')
    } finally {
      setUazapiLoading(false)
    }
  }

  async function desconectarInstancia() {
    if (!uazapiInteg) return
    const token = (uazapiInteg.config as Record<string, string>)?.api_key
    if (!token) return

    if (!confirm('Deseja realmente desconectar e excluir esta instância do WhatsApp?')) return

    setUazapiLoading(true)
    try {
      await uazapi.deleteInstance(token)
      setUazapiStatus('disconnected')
      setUazapiQR('')
      alert('Instância desconectada com sucesso.')
    } catch (error) {
      console.error(error)
      setUazapiError('Erro ao desconectar instância.')
    } finally {
      setUazapiLoading(false)
    }
  }

  const getEmpresaNome = (id: number) => {
    const emp = empresas.find(e => e.id === id)
    return emp?.nome_fantasia || emp?.nome || `Empresa #${id}`
  }
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
                      {['whatsapp', 'uazapi'].includes(integ.tipo) && (
                        <>
                          <button
                            onClick={() => abrirUazapi(integ)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-accent-green hover:text-white hover:bg-accent-green/20 rounded-lg transition-colors"
                            title="Gerenciar Instância"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Instância
                          </button>
                          <button
                            onClick={() => abrirChatwoot(integ)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-accent-blue hover:text-white hover:bg-accent-blue/20 rounded-lg transition-colors"
                            title="Configurar Chatwoot"
                          >
                            <MessageSquareText className="w-3.5 h-3.5" />
                            Chatwoot
                          </button>
                        </>
                      )}
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

      {/* Modal Criar/Editar Integração */}
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
              {(['whatsapp', 'uazapi'].includes(form.tipo)) && (
                <>
                  <FormField label="URL da API (UAZAPI)"><Input value={form.config.api_url} onChange={e => setForm({ ...form, config: { ...form.config, api_url: e.target.value } })} placeholder="https://seudominio.uazapi.com" /></FormField>
                  <FormField label="Número do Telefone"><Input value={form.config.phone_number} onChange={e => setForm({ ...form, config: { ...form.config, phone_number: e.target.value } })} placeholder="+55 11 99999-9999" /></FormField>
                  <FormField label="Nome da Instância"><Input value={form.config.instance_name} onChange={e => setForm({ ...form, config: { ...form.config, instance_name: e.target.value } })} placeholder="instancia-01" /></FormField>
                  <FormField label="Token da API"><Input value={form.config.api_key} onChange={e => setForm({ ...form, config: { ...form.config, api_key: e.target.value } })} placeholder="Token UAZAPI..." type="password" /></FormField>
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

          {['whatsapp', 'uazapi'].includes(form.tipo) && !editando && (
            <div className="flex items-start gap-2 bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-3">
              <Info className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-blue">Cada empresa pode ter somente 1 instância WhatsApp conectada.</p>
            </div>
          )}

          {erro && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
              <p className="text-sm text-accent-red">{erro}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarDelete}
        title="Excluir Integração" message={`Excluir integração "${confirmDelete?.tipo}"?`} confirmLabel="Excluir" />

      {/* ================================================ */}
      {/* Modal Configuração do Chatwoot (GET/PUT UAZAPI)  */}
      {/* ================================================ */}
      <Modal
        open={chatwootModal}
        onClose={() => { setChatwootModal(false); setChatwootErro(''); setChatwootSucesso('') }}
        title="Configurar Chatwoot"
        size="lg"
      >
        {chatwootLoading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-sm text-gray-400">Carregando configuração do Chatwoot...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Info da instância */}
            {chatwootInteg && (
              <div className="bg-bg-secondary rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-accent-green" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    WhatsApp - {getEmpresaNome(chatwootInteg.empresa_id)}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {((chatwootInteg.config as Record<string, string>)?.api_url || '').substring(0, 45)}
                  </p>
                </div>
                <button
                  onClick={recarregarChatwoot}
                  className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
                  title="Recarregar configuração"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Toggle principal */}
            <div className="flex items-center justify-between bg-bg-elevated rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-white">Integração Chatwoot</p>
                <p className="text-xs text-gray-400">Ativar/desativar o envio de mensagens pro Chatwoot</p>
              </div>
              <Toggle
                checked={chatwootForm.enabled}
                onChange={v => setChatwootForm({ ...chatwootForm, enabled: v })}
              />
            </div>

            {/* Campos de configuração */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" />
                Dados do Chatwoot
              </h4>

              <FormField label="URL do Chatwoot" required>
                <Input
                  value={chatwootForm.url}
                  onChange={e => setChatwootForm({ ...chatwootForm, url: e.target.value })}
                  placeholder="https://atendimento.seudominio.com.br"
                />
              </FormField>

              <FormField label="Access Token" required>
                <Input
                  value={chatwootForm.access_token}
                  onChange={e => setChatwootForm({ ...chatwootForm, access_token: e.target.value })}
                  placeholder="Token de acesso do Chatwoot"
                  type="password"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Account ID">
                  <Input
                    type="number"
                    value={chatwootForm.account_id.toString()}
                    onChange={e => setChatwootForm({ ...chatwootForm, account_id: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </FormField>
                <FormField label="Inbox ID">
                  <Input
                    type="number"
                    value={chatwootForm.inbox_id.toString()}
                    onChange={e => setChatwootForm({ ...chatwootForm, inbox_id: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </FormField>
              </div>
            </div>

            {/* Opções */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Opções
              </h4>

              <div className="bg-bg-elevated rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Ignorar Grupos</p>
                    <p className="text-xs text-gray-500">Não enviar mensagens de grupos pro Chatwoot</p>
                  </div>
                  <Toggle
                    checked={chatwootForm.ignore_groups}
                    onChange={v => setChatwootForm({ ...chatwootForm, ignore_groups: v })}
                  />
                </div>

                <div className="border-t border-bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Assinar Mensagens</p>
                    <p className="text-xs text-gray-500">Mostrar nome do agente nas mensagens</p>
                  </div>
                  <Toggle
                    checked={chatwootForm.sign_messages}
                    onChange={v => setChatwootForm({ ...chatwootForm, sign_messages: v })}
                  />
                </div>

                <div className="border-t border-bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Criar Nova Conversa</p>
                    <p className="text-xs text-gray-500">Criar nova conversa a cada contato do cliente</p>
                  </div>
                  <Toggle
                    checked={chatwootForm.create_new_conversation}
                    onChange={v => setChatwootForm({ ...chatwootForm, create_new_conversation: v })}
                  />
                </div>
              </div>
            </div>

            {/* Mensagens de erro/sucesso */}
            {chatwootErro && (
              <div className="flex items-start gap-2 bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
                <p className="text-sm text-accent-red">{chatwootErro}</p>
              </div>
            )}

            {chatwootSucesso && (
              <div className="flex items-start gap-2 bg-accent-green/10 border border-accent-green/20 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <p className="text-sm text-accent-green">{chatwootSucesso}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={() => { setChatwootModal(false); setChatwootErro(''); setChatwootSucesso('') }}
            className="btn-secondary"
          >
            Fechar
          </button>
          {!chatwootLoading && (
            <button
              onClick={salvarChatwoot}
              disabled={chatwootSalvando}
              className="btn-primary"
            >
              {chatwootSalvando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                'Salvar Chatwoot'
              )}
            </button>
          )}
        </div>
      </Modal>

      {/* ================================================ */}
      {/* Modal Gerenciamento Uazapi (WhatsApp)            */}
      {/* ================================================ */}
      <Modal
        open={uazapiModal}
        onClose={() => { setUazapiModal(false); setUazapiQR(''); setUazapiError('') }}
        title="Gerenciar Instância WhatsApp"
        size="md"
      >
        <div className="space-y-6 py-2">
          {uazapiStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-gray-400">Verificando status da instância...</p>
            </div>
          ) : (
            <>
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-bg-border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    uazapiStatus === 'connected' ? "bg-accent-green shadow-glow-sm shadow-accent-green/50" :
                      uazapiStatus === 'connecting' ? "bg-accent-yellow shadow-glow-sm shadow-accent-yellow/50" :
                        "bg-accent-red shadow-glow-sm shadow-accent-red/50"
                  )} />
                  <div>
                    <p className="text-sm font-semibold text-white capitalize">
                      {uazapiStatus === 'connected' ? 'Conectado' :
                        uazapiStatus === 'connecting' ? 'Aguardando Leitura' :
                          uazapiStatus === 'disconnected' ? 'Desconectado' : 'Erro de Conexão'}
                    </p>
                    <p className="text-xs text-gray-500">Status atual do servidor</p>
                  </div>
                </div>
                <button
                  onClick={() => uazapiInteg && atualizarStatusUazapi((uazapiInteg.config as Record<string, string>)?.api_key)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors"
                >
                  <RefreshCw className={cn("w-4 h-4", uazapiLoading && "animate-spin")} />
                </button>
              </div>

              {/* QR Code Section */}
              {uazapiStatus === 'connecting' && uazapiQR && (
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-glow-sm mx-auto w-fit">
                  <img src={uazapiQR} alt="WhatsApp QR Code" className="w-56 h-56" />
                  <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Escaneie com seu WhatsApp</p>
                </div>
              )}

              {/* Connected State */}
              {uazapiStatus === 'connected' && (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                    <CheckCircle className="w-10 h-10 text-accent-green" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Sua instância está ativa!</p>
                    <p className="text-sm text-gray-400 mt-1">Todas as funcionalidades estão operacionais.</p>
                  </div>
                </div>
              )}

              {/* Actions & Info */}
              <div className="space-y-4">
                <div className="bg-bg-elevated rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Token da Instância</span>
                    <span className="text-xs font-mono text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded cursor-pointer hover:bg-brand-400/20 transition-colors"
                      onClick={() => {
                        const token = (uazapiInteg?.config as Record<string, string>)?.api_key || ''
                        navigator.clipboard.writeText(token)
                        alert('Token copiado!')
                      }}
                    >
                      {((uazapiInteg?.config as Record<string, string>)?.api_key || '').substring(0, 15)}... (clique para copiar)
                    </span>
                  </div>
                  <div className="border-t border-bg-border/50" />
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Use este token no Chatwoot para centralizar suas conversas.
                    Certifique-se de que a instância esteja <b>conectada</b> antes de testar a integração.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {uazapiStatus !== 'connected' && (
                    <button
                      onClick={gerarNovoQRCode}
                      disabled={uazapiLoading}
                      className="btn-primary flex-1 justify-center py-3"
                    >
                      {uazapiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Gerar QR Code
                    </button>
                  )}
                  <button
                    onClick={desconectarInstancia}
                    disabled={uazapiLoading}
                    className={cn(
                      "btn-secondary flex-1 justify-center py-3 border-accent-red/20 text-accent-red hover:bg-accent-red/10",
                      uazapiStatus === 'connected' && "col-span-2"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Desconectar
                  </button>
                </div>
              </div>

              {uazapiError && (
                <div className="flex items-start gap-2 bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-accent-red">{uazapiError}</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={() => setUazapiModal(false)} className="btn-secondary">Fechar</button>
        </div>
      </Modal>
    </div>
  )
}
