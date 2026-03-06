// =====================================================
// TIPOS PRINCIPAIS DO SISTEMA
// =====================================================

export interface NocoPaginado<T> {
  list: T[]
  pageInfo: {
    totalRows: number
    page: number
    pageSize: number
    isFirstPage: boolean
    isLastPage: boolean
  }
}

// =====================================================
// EMPRESAS
// =====================================================
export interface Empresa {
  id: number
  uuid: string
  nome: string
  nome_fantasia: string
  cnpj: string
  email: string
  telefone: string
  website: string | null
  plano: 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
  config: Record<string, unknown>
  created_at: string
  updated_at: string
  // Contagens relacionadas
  conversas?: number
  faqs?: number
  followups?: number
  integracoes?: number
  metricas_diarias?: number
  personalidade_ia?: number
  planos?: number
  templates_followups?: number
  unidades?: number
}

// =====================================================
// UNIDADES
// =====================================================
export interface Unidade {
  id: number
  empresa_id: number
  uuid: string
  slug: string
  codigo: string
  nome: string
  nome_abreviado: string
  descricao: string | null
  endereco: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  pais: string
  latitude: number | null
  longitude: number | null
  telefone_principal: string
  telefone_secundario: string | null
  whatsapp: string
  email_contato: string
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  youtube: string | null
  site: string | null
  link_matricula: string | null
  link_agendamento: string | null
  link_tour_virtual: string | null
  horarios: Record<string, string> | null
  infraestrutura: string[] | null
  servicos: string[] | null
  modalidades: string[] | null
  planos: string[] | null
  formas_pagamento: string[] | null
  convenios: string[] | null
  palavras_chave: string[] | null
  ativa: boolean
  ordem_exibicao: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// =====================================================
// PERSONALIDADE IA
// =====================================================
export interface PersonalidadeIA {
  id: number
  empresa_id: number
  nome_ia: string
  personalidade: string
  tom_voz: string
  estilo_comunicacao: string
  instrucoes_base: string
  regras_atendimento: string
  temperatura: number
  max_tokens: number
  modelo_preferido: 'gemini' | 'openai' | 'auto'
  exemplos: string | null
  palavras_proibidas: string[] | null
  saudacao_personalizada: string | null
  despedida_personalizada: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// FAQ
// =====================================================
export interface FAQ {
  id: number
  empresa_id: number
  unidade_id: number | null
  uuid: string
  categoria: string
  pergunta: string
  resposta: string
  variacoes: string[] | null
  prioridade: number
  idioma: string
  tags: string[] | null
  ativo: boolean
  visualizacoes: number
  vezes_utilizado: number
  feedback_positivo: number
  feedback_negativo: number
  created_at: string
  updated_at: string
}

// =====================================================
// CONVERSAS
// =====================================================
export interface Conversa {
  id: number
  uuid: string
  conversation_id: string
  empresa_id: number
  unidade_id: number | null
  contato_id: string | null
  contato_nome: string
  contato_email: string | null
  contato_telefone: string
  primeira_mensagem: string | null
  primeira_resposta_em: string | null
  ultima_mensagem: string | null
  tempo_medio_resposta: number | null
  total_mensagens_cliente: number
  total_mensagens_ia: number
  score_interesse: number
  lead_qualificado: boolean
  conversao_detectada: boolean
  estados: string[] | null
  canal: string
  tags: string[] | null
  metadata: Record<string, unknown> | null
  status: 'open' | 'closed' | 'pending' | 'resolved'
  motivo_encerramento: string | null
  encerrada_em: string | null
  created_at: string
  updated_at: string
  account_id: string | null
}

// =====================================================
// MENSAGENS
// =====================================================
export interface Mensagem {
  id: number
  conversa_id: number
  message_id: string | null
  role: 'user' | 'assistant' | 'system'
  tipo: 'text' | 'image' | 'audio' | 'document'
  conteudo: string
  conteudo_comprimido: string | null
  url_midia: string | null
  tipo_midia: string | null
  tokens_estimados: number | null
  tempo_resposta: number | null
  feedback_usuario: 'positive' | 'negative' | null
  created_at: string
}

// =====================================================
// FOLLOWUPS
// =====================================================
export interface Followup {
  id: number
  conversa_id: number
  empresa_id: number
  unidade_id: number | null
  template_id: number | null
  tipo: string
  mensagem: string
  ordem: number
  agendado_para: string
  enviado_em: string | null
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  erro_log: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// TEMPLATES FOLLOWUP
// =====================================================
export interface TemplateFollowup {
  id: number
  empresa_id: number
  unidade_id: number | null
  nome: string
  descricao: string | null
  tipo: string
  mensagem: string
  variaveis: string[] | null
  delay_minutos: number
  ordem: number
  condicoes: Record<string, unknown> | null
  ativo: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// EVENTOS FUNIL
// =====================================================
export interface EventoFunil {
  id: number
  conversa_id: number
  uuid: string
  tipo_evento: string
  descricao: string
  score_incremento: number
  payload: Record<string, unknown> | null
  created_at: string
}

// =====================================================
// MÉTRICAS DIÁRIAS
// =====================================================
export interface MetricaDiaria {
  id: number
  empresa_id: number
  unidade_id: number | null
  data: string
  total_conversas: number
  total_mensagens: number
  total_leads: number
  total_conversoes: number
  tempo_medio_resposta: number
  taxa_resolucao: number
  score_satisfacao: number
  created_at: string
  updated_at: string
}

// =====================================================
// LOGS DE ERRO
// =====================================================
export interface LogErro {
  id: number
  empresa_id: number | null
  unidade_id: number | null
  conversa_id: number | null
  tipo_erro: string
  mensagem: string
  stack_trace: string | null
  contexto: Record<string, unknown> | null
  resolvido: boolean
  created_at: string
}

// =====================================================
// CACHE RESPOSTAS
// =====================================================
export interface CacheResposta {
  id: number
  empresa_id: number
  unidade_id: number | null
  hash_pergunta: string
  pergunta: string
  resposta: string
  modelo_usado: string
  tokens_gastos: number
  tempo_resposta: number
  vezes_usado: number
  ultima_vez_usado: string
  created_at: string
}

// =====================================================
// INTEGRAÇÕES
// =====================================================
export interface Integracao {
  id: number
  empresa_id: number
  tipo: string
  config: Record<string, unknown>
  ativo: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// PLANOS
// =====================================================
export interface Plano {
  id: number
  empresa_id: number
  unidade_id: number | null
  id_externo: string | null
  nome: string
  valor: number
  valor_promocional: number | null
  meses_promocionais: number | null
  descricao: string | null
  diferenciais: string[] | null
  link_venda: string | null
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}
