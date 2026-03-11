'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { PageLoading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { Bot, Plus, Edit2, Zap, Brain, Settings2, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import {
  getPersonalidadeIA, getEmpresas, criarPersonalidadeIA, atualizarPersonalidadeIA
} from '@/lib/nocodb'
import { testarConfigIA } from '@/lib/ia-api'
import type { PersonalidadeIA, Empresa } from '@/types'
import { MODELO_IA_LABELS, formatarDataRelativa } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function IAPage() {
  const [configs, setConfigs] = useState<PersonalidadeIA[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<PersonalidadeIA | null>(null)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [respostaTeste, setRespostaTeste] = useState<string | null>(null)
  const [msgTeste, setMsgTeste] = useState('Olá! Como você pode me ajudar?')

  const [form, setForm] = useState({
    empresa_id: '',
    nome_ia: '',
    personalidade: '',
    tom_voz: 'profissional',
    estilo_comunicacao: '',
    instrucoes_base: '',
    regras_atendimento: '',
    temperatura: '0.7',
    max_tokens: '1000',
    modelo_preferido: 'auto' as 'gemini' | 'openai' | 'auto',
    palavras_proibidas: '',
    saudacao_personalizada: '',
    despedida_personalizada: '',
    ativo: true,
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [configsData, empresasData] = await Promise.all([
        getPersonalidadeIA(),
        getEmpresas({ limit: 100 }),
      ])
      setConfigs(configsData.list as PersonalidadeIA[])
      setEmpresas(empresasData.list as Empresa[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({
      empresa_id: empresas[0]?.id?.toString() || '',
      nome_ia: 'Assistente IA',
      personalidade: '',
      tom_voz: 'profissional',
      estilo_comunicacao: '',
      instrucoes_base: '',
      regras_atendimento: '',
      temperatura: '0.7',
      max_tokens: '1000',
      modelo_preferido: 'auto',
      palavras_proibidas: '',
      saudacao_personalizada: '',
      despedida_personalizada: '',
      ativo: true,
    })
    setRespostaTeste(null)
    setModalAberto(true)
  }

  function abrirEditar(config: PersonalidadeIA) {
    setEditando(config)
    setForm({
      empresa_id: config.empresa_id?.toString() || '',
      nome_ia: config.nome_ia || '',
      personalidade: config.personalidade || '',
      tom_voz: config.tom_voz || 'profissional',
      estilo_comunicacao: config.estilo_comunicacao || '',
      instrucoes_base: config.instrucoes_base || '',
      regras_atendimento: config.regras_atendimento || '',
      temperatura: config.temperatura?.toString() || '0.7',
      max_tokens: config.max_tokens?.toString() || '1000',
      modelo_preferido: config.modelo_preferido || 'auto',
      palavras_proibidas: Array.isArray(config.palavras_proibidas) ? config.palavras_proibidas.join(', ') : '',
      saudacao_personalizada: config.saudacao_personalizada || '',
      despedida_personalizada: config.despedida_personalizada || '',
      ativo: config.ativo ?? true,
    })
    setRespostaTeste(null)
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const dados = {
        ...form,
        empresa_id: parseInt(form.empresa_id),
        temperatura: parseFloat(form.temperatura),
        max_tokens: parseInt(form.max_tokens),
        palavras_proibidas: form.palavras_proibidas
          ? form.palavras_proibidas.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }
      if (editando) {
        await atualizarPersonalidadeIA(editando.id, dados)
      } else {
        await criarPersonalidadeIA(dados)
      }
      setModalAberto(false)
      carregar()
    } catch (e) { console.error(e) }
    finally { setSalvando(false) }
  }

  async function testar() {
    if (!form.empresa_id) {
      setRespostaTeste('❌ Selecione uma empresa primeiro')
      return
    }
    if (!msgTeste.trim()) {
      setRespostaTeste('❌ Digite uma mensagem para testar')
      return
    }
    setTestando(true)
    setRespostaTeste(null)
    try {
      // Salva a config antes de testar para que a IA use as configurações atuais
      const dados = {
        ...form,
        empresa_id: parseInt(form.empresa_id),
        temperatura: parseFloat(form.temperatura),
        max_tokens: parseInt(form.max_tokens),
        palavras_proibidas: form.palavras_proibidas
          ? form.palavras_proibidas.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }
      if (editando) {
        await atualizarPersonalidadeIA(editando.id, dados)
      }

      const resultado = await testarConfigIA(
        parseInt(form.empresa_id),
        msgTeste,
        form.modelo_preferido
      )
      setRespostaTeste(resultado.sucesso
        ? `✅ ${resultado.resposta}`
        : `❌ Erro: ${resultado.erro || 'A API de IA não retornou resposta. Verifique se o serviço está online.'}`
      )
    } catch (error) {
      const err = error as { message?: string; response?: { status?: number } }
      if (err.response?.status === 404) {
        setRespostaTeste('❌ Endpoint de teste não encontrado na API de IA. Verifique a URL da API.')
      } else if (err.response?.status === 500) {
        setRespostaTeste('❌ Erro interno na API de IA. Tente novamente em alguns instantes.')
      } else {
        setRespostaTeste(`❌ Erro ao conectar com a API de IA: ${err.message || 'Serviço pode estar offline'}`)
      }
    } finally {
      setTestando(false)
    }
  }

  const getEmpresaNome = (id: number) => {
    const emp = empresas.find(e => e.id === id)
    return emp?.nome_fantasia || emp?.nome || `Empresa #${id}`
  }

  const modeloBadge = (modelo: string) => {
    const cores: Record<string, 'info' | 'success' | 'purple'> = { gemini: 'info', openai: 'success', auto: 'purple' }
    return <Badge variant={cores[modelo] ?? 'default'}>{MODELO_IA_LABELS[modelo] || modelo}</Badge>
  }

  if (loading) return <PageLoading text="Carregando configurações de IA..." />

  return (
    <div className="animate-fade">
      <Header
        title="Configuração da IA"
        subtitle="Defina a personalidade e comportamento da IA por empresa"
        actions={
          <button onClick={abrirNovo} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Config IA
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {configs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Bot}
              title="Nenhuma configuração de IA"
              description="Configure a personalidade e comportamento da IA para cada empresa"
              action={<button onClick={abrirNovo} className="btn-primary">Criar Configuração</button>}
            />
          </div>
        ) : (
          configs.map((config) => (
            <div key={config.id} className="card overflow-hidden">
              {/* Header do card */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-blue flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{config.nome_ia}</p>
                    {modeloBadge(config.modelo_preferido)}
                    {config.ativo
                      ? <Badge variant="success">Ativo</Badge>
                      : <Badge variant="default">Inativo</Badge>
                    }
                  </div>
                  <p className="text-sm text-gray-400">{getEmpresaNome(config.empresa_id)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirEditar(config)}
                    className="btn-secondary py-1.5 px-3 text-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setExpandido(expandido === config.id ? null : config.id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-bg-hover rounded-lg transition-colors"
                  >
                    {expandido === config.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expandido === config.id && (
                <div className="border-t border-bg-border px-5 py-4 space-y-4 bg-bg-secondary/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Tom de Voz', value: config.tom_voz },
                      { label: 'Temperatura', value: config.temperatura },
                      { label: 'Max Tokens', value: config.max_tokens },
                      { label: 'Atualizado', value: formatarDataRelativa(config.updated_at) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="text-sm text-white font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {config.instrucoes_base && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Instruções Base</p>
                      <p className="text-sm text-gray-300 bg-bg-elevated rounded-lg p-3">{config.instrucoes_base}</p>
                    </div>
                  )}
                  {config.personalidade && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Personalidade</p>
                      <p className="text-sm text-gray-300 bg-bg-elevated rounded-lg p-3">{config.personalidade}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? `Editar: ${editando.nome_ia}` : 'Nova Configuração IA'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Info básica */}
          <div>
            <h4 className="text-sm font-semibold text-brand-400 mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Informações Básicas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Empresa" required>
                <Select
                  value={form.empresa_id}
                  onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                  options={empresas.map(e => ({ value: e.id.toString(), label: e.nome_fantasia || e.nome }))}
                />
              </FormField>
              <FormField label="Nome da IA" required>
                <Input
                  value={form.nome_ia}
                  onChange={(e) => setForm({ ...form, nome_ia: e.target.value })}
                  placeholder="Ex: Assistente Virtual"
                />
              </FormField>
              <FormField label="Modelo de IA">
                <Select
                  value={form.modelo_preferido}
                  onChange={(e) => setForm({ ...form, modelo_preferido: e.target.value as 'gemini' | 'openai' | 'auto' })}
                  options={[
                    { value: 'auto', label: '🤖 Automático' },
                    { value: 'gemini', label: '✨ Google Gemini' },
                    { value: 'openai', label: '💬 OpenAI GPT' },
                  ]}
                />
              </FormField>
              <FormField label="Tom de Voz">
                <Select
                  value={form.tom_voz}
                  onChange={(e) => setForm({ ...form, tom_voz: e.target.value })}
                  options={[
                    { value: 'profissional', label: 'Profissional' },
                    { value: 'amigavel', label: 'Amigável' },
                    { value: 'formal', label: 'Formal' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'energico', label: 'Energético' },
                    { value: 'empatico', label: 'Empático' },
                    { value: 'tecnico', label: 'Técnico' },
                    { value: 'humoristico', label: 'Humorístico' },
                    { value: 'consultivo', label: 'Consultivo' },
                    { value: 'motivacional', label: 'Motivacional' },
                    { value: 'acolhedor', label: 'Acolhedor' },
                    { value: 'direto', label: 'Direto e Objetivo' },
                    { value: 'persuasivo', label: 'Persuasivo' },
                  ]}
                />
              </FormField>
            </div>
          </div>

          {/* Personalidade */}
          <div>
            <h4 className="text-sm font-semibold text-brand-400 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Personalidade & Comportamento
            </h4>
            <div className="space-y-4">
              <FormField label="Personalidade">
                <Textarea
                  value={form.personalidade}
                  onChange={(e) => setForm({ ...form, personalidade: e.target.value })}
                  placeholder="Descreva como a IA deve se comportar, seus traços de personalidade..."
                  rows={3}
                />
              </FormField>
              <FormField label="Instruções Base">
                <Textarea
                  value={form.instrucoes_base}
                  onChange={(e) => setForm({ ...form, instrucoes_base: e.target.value })}
                  placeholder="Instruções que a IA deve sempre seguir..."
                  rows={3}
                />
              </FormField>
              <FormField label="Regras de Atendimento">
                <Textarea
                  value={form.regras_atendimento}
                  onChange={(e) => setForm({ ...form, regras_atendimento: e.target.value })}
                  placeholder="Regras específicas para o atendimento..."
                  rows={3}
                />
              </FormField>
            </div>
          </div>

          {/* Config avançada */}
          <div>
            <h4 className="text-sm font-semibold text-brand-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Configurações Avançadas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={`Temperatura: ${form.temperatura}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperatura}
                  onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Preciso</span><span>Criativo</span>
                </div>
              </FormField>
              <FormField label="Max Tokens">
                <Input
                  type="number"
                  value={form.max_tokens}
                  onChange={(e) => setForm({ ...form, max_tokens: e.target.value })}
                />
              </FormField>
              <FormField label="Saudação Personalizada" className="col-span-2">
                <Input
                  value={form.saudacao_personalizada}
                  onChange={(e) => setForm({ ...form, saudacao_personalizada: e.target.value })}
                  placeholder="Olá! Bem-vindo! Como posso ajudar?"
                />
              </FormField>
              <FormField label="Despedida Personalizada" className="col-span-2">
                <Input
                  value={form.despedida_personalizada}
                  onChange={(e) => setForm({ ...form, despedida_personalizada: e.target.value })}
                  placeholder="Até mais! Foi um prazer ajudar!"
                />
              </FormField>
              <FormField label="Palavras Proibidas (separadas por vírgula)" className="col-span-2">
                <Input
                  value={form.palavras_proibidas}
                  onChange={(e) => setForm({ ...form, palavras_proibidas: e.target.value })}
                  placeholder="spam, proibido, ..."
                />
              </FormField>
              <div className="col-span-2">
                <Toggle
                  checked={form.ativo}
                  onChange={(v) => setForm({ ...form, ativo: v })}
                  label="Configuração ativa"
                />
              </div>
            </div>
          </div>

          {/* Área de teste */}
          <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-accent-green" />
              Testar Configuração
            </h4>
            <div className="flex gap-2">
              <Input
                value={msgTeste}
                onChange={(e) => setMsgTeste(e.target.value)}
                placeholder="Digite uma mensagem para testar..."
                className="flex-1"
              />
              <button
                onClick={testar}
                disabled={testando || !form.empresa_id}
                className="btn-secondary flex-shrink-0"
              >
                {testando ? 'Testando...' : 'Testar'}
              </button>
            </div>
            {respostaTeste && (
              <div className="bg-bg-elevated rounded-lg p-3 text-sm text-gray-300">
                {respostaTeste}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalAberto(false)} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar Config IA'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
