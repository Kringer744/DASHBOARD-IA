import axios from 'axios'

// =====================================================
// API DO SERVIÇO DE IA
// =====================================================

let rawIaUrl = process.env.NEXT_PUBLIC_IA_API_URL || 'https://ia-33sy.onrender.com'
if (rawIaUrl && !rawIaUrl.startsWith('http')) {
  rawIaUrl = `https://${rawIaUrl}`
}
const IA_URL = rawIaUrl.replace(/\/$/, '')

const iaApi = axios.create({
  baseURL: IA_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // IA pode demorar mais
})

// =====================================================
// TIPOS
// =====================================================

export type ModeloIA = 'gemini' | 'openai' | 'auto'

export interface MensagemIA {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface EnviarMensagemParams {
  empresa_id: number
  unidade_id?: number
  conversa_id?: number
  mensagem: string
  modelo?: ModeloIA
  historico?: MensagemIA[]
  contexto?: Record<string, unknown>
}

export interface RespostaIA {
  resposta: string
  modelo_usado: string
  tokens_gastos?: number
  tempo_resposta?: number
  sucesso: boolean
  erro?: string
}

export interface StatusIA {
  online: boolean
  versao?: string
  modelos_disponiveis?: string[]
}

// =====================================================
// FUNÇÕES DA API
// =====================================================

/**
 * Verifica o status/saúde do serviço de IA
 */
export async function verificarStatusIA(): Promise<StatusIA> {
  try {
    const response = await iaApi.get('/health')
    return {
      online: true,
      versao: response.data?.version,
      modelos_disponiveis: response.data?.models,
    }
  } catch {
    return { online: false }
  }
}

/**
 * Envia mensagem para a IA e recebe resposta
 */
export async function enviarMensagem(params: EnviarMensagemParams): Promise<RespostaIA> {
  try {
    const response = await iaApi.post('/chat', {
      empresa_id: params.empresa_id,
      unidade_id: params.unidade_id,
      conversa_id: params.conversa_id,
      message: params.mensagem,
      model: params.modelo || 'auto',
      history: params.historico || [],
      context: params.contexto || {},
    })

    return {
      resposta: response.data?.response || response.data?.message || '',
      modelo_usado: response.data?.model_used || 'unknown',
      tokens_gastos: response.data?.tokens_used,
      tempo_resposta: response.data?.response_time,
      sucesso: true,
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    return {
      resposta: '',
      modelo_usado: 'none',
      sucesso: false,
      erro: err.response?.data?.message || err.message || 'Erro ao conectar com a IA',
    }
  }
}

/**
 * Testa a configuração de IA de uma empresa
 */
export async function testarConfigIA(
  empresaId: number,
  mensagemTeste: string,
  modelo: ModeloIA = 'auto'
): Promise<RespostaIA> {
  return enviarMensagem({
    empresa_id: empresaId,
    mensagem: mensagemTeste,
    modelo,
    contexto: { teste: true },
  })
}

/**
 * Processa um FAQ específico com a IA
 */
export async function processarFAQ(
  empresaId: number,
  pergunta: string
): Promise<{ resposta: string; sucesso: boolean }> {
  try {
    const response = await iaApi.post('/faq', {
      empresa_id: empresaId,
      pergunta,
    })

    return {
      resposta: response.data?.resposta || '',
      sucesso: true,
    }
  } catch {
    return { resposta: '', sucesso: false }
  }
}

/**
 * Obtém informações do modelo disponível
 */
export async function getInfoModelos(): Promise<{
  modelos: Array<{ id: string; nome: string; disponivel: boolean }>
}> {
  try {
    const response = await iaApi.get('/models')
    return {
      modelos: response.data?.models || [
        { id: 'gemini', nome: 'Google Gemini', disponivel: true },
        { id: 'openai', nome: 'OpenAI GPT', disponivel: true },
        { id: 'auto', nome: 'Automático', disponivel: true },
      ],
    }
  } catch {
    return {
      modelos: [
        { id: 'gemini', nome: 'Google Gemini', disponivel: true },
        { id: 'openai', nome: 'OpenAI GPT', disponivel: true },
        { id: 'auto', nome: 'Automático', disponivel: true },
      ],
    }
  }
}
