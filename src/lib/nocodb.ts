import axios from 'axios'

// =====================================================
// CONFIGURAÇÃO DA API NOCODB
// =====================================================

let rawBaseUrl = process.env.NEXT_PUBLIC_NOCODB_URL || 'https://desk-nocodb.5y4hfw.easypanel.host'
if (rawBaseUrl && !rawBaseUrl.startsWith('http')) {
  rawBaseUrl = `https://${rawBaseUrl}`
}
const BASE_URL = rawBaseUrl.replace(/\/$/, '')

const TOKEN = process.env.NEXT_PUBLIC_NOCODB_TOKEN || 'dfx-T6kTspesvooij0wJeYxQ7hBZmDe40RxYZiO8'
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID || 'pslvd73baqrfuhp'

// IDs das tabelas (coletados via API meta)
export const TABLE_IDS = {
  empresas: 'moi04r0iuccvhwc',
  unidades: 'mpox9m5jgnks3n3',
  personalidade_ia: 'mvfgubjkqbioo8s',
  faq: 'mcjaj2lozjq4cnt',
  conversas: 'm7s6ctxo8j5pxhh',
  mensagens: 'mayw0d57bbah5sx',
  followups: 'mnhe69176x21wpg',
  templates_followup: 'mauo5wakvxdr8ie',
  eventos_funil: 'm81q133roxtrr9b',
  metricas_diarias: 'm0g5rxsn7jfn5ss',
  logs_erro: 'm8o4j3rsj6bcho6',
  cache_respostas: 'm1kubgrn92qtqss',
  integracoes: 'miz8ntbjw5lxbhs',
  planos: 'mgk8w5o8sgnnv3y',
} as const

export type TableName = keyof typeof TABLE_IDS

// =====================================================
// INSTÂNCIA AXIOS
// =====================================================

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1/db/data/noco/${PROJECT_ID}`,
  headers: {
    'xc-token': TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// =====================================================
// AUXILIARES DE TRANSFORMAÇÃO
// =====================================

function parseIfNeeded(value: any) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed)
      } catch (e) {
        return value
      }
    }
  }
  return value
}

function transformItem<T>(item: any): T {
  if (!item || typeof item !== 'object') return item as T
  const newItem = { ...item }
  for (const key in newItem) {
    newItem[key] = parseIfNeeded(newItem[key])
  }
  return newItem as T
}

// =====================================================
// INTERFACE DE CONSULTA
// =====================================================

export interface QueryParams {
  page?: number
  limit?: number
  where?: string
  sort?: string
  fields?: string
}

export interface PageInfo {
  totalRows: number
  page: number
  pageSize: number
  isFirstPage: boolean
  isLastPage: boolean
}

export interface ListResponse<T> {
  list: T[]
  pageInfo: PageInfo
}

// =====================================================
// FUNÇÕES CRUD GENÉRICAS
// =====================================================

export async function listar<T>(
  tabela: TableName,
  params: QueryParams = {}
): Promise<ListResponse<T>> {
  const { page = 1, limit = 25, where, sort, fields } = params
  const offset = (page - 1) * limit

  const response = await api.get<ListResponse<T>>(`/${TABLE_IDS[tabela]}`, {
    params: {
      limit,
      offset,
      where: where || undefined,
      sort: sort || undefined,
      fields: fields || undefined,
    },
  })

  // Transformar itens se necessário (campos JSON que viraram texto)
  if (response.data && response.data.list) {
    response.data.list = response.data.list.map(item => transformItem<T>(item))
  }

  return response.data
}

export async function buscarPorId<T>(tabela: TableName, id: number): Promise<T> {
  const response = await api.get<T>(`/${TABLE_IDS[tabela]}/${id}`)
  return transformItem<T>(response.data)
}

export async function criar<T>(tabela: TableName, dados: Partial<T>): Promise<T> {
  const response = await api.post<T>(`/${TABLE_IDS[tabela]}`, dados)
  return transformItem<T>(response.data)
}

export async function atualizar<T>(
  tabela: TableName,
  id: number,
  dados: Partial<T>
): Promise<T> {
  const response = await api.patch<T>(`/${TABLE_IDS[tabela]}/${id}`, dados)
  return transformItem<T>(response.data)
}

export async function deletar(tabela: TableName, id: number): Promise<void> {
  await api.delete(`/${TABLE_IDS[tabela]}/${id}`)
}

// =====================================================
// FUNÇÕES ESPECÍFICAS POR ENTIDADE
// =====================================================

// --- EMPRESAS ---
export async function getEmpresas(params?: QueryParams) {
  return listar('empresas', { sort: '-created_at', ...params })
}

export async function getEmpresa(id: number) {
  return buscarPorId('empresas', id)
}

export async function criarEmpresa(dados: Record<string, unknown>) {
  return criar('empresas', dados)
}

export async function atualizarEmpresa(id: number, dados: Record<string, unknown>) {
  return atualizar('empresas', id, dados)
}

// --- UNIDADES ---
export async function getUnidades(empresaId?: number, params?: QueryParams) {
  const empresaWhere = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  const where = empresaWhere && params?.where
    ? `${empresaWhere}~and${params.where}`
    : empresaWhere || params?.where
  return listar('unidades', { ...params, where, sort: params?.sort || 'ordem_exibicao' })
}

export async function getUnidade(id: number) {
  return buscarPorId('unidades', id)
}

export async function criarUnidade(dados: Record<string, unknown>) {
  return criar('unidades', dados)
}

export async function atualizarUnidade(id: number, dados: Record<string, unknown>) {
  return atualizar('unidades', id, dados)
}

export async function deletarUnidade(id: number) {
  return deletar('unidades', id)
}

// --- PERSONALIDADE IA ---
export async function getPersonalidadeIA(empresaId?: number) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('personalidade_ia', { where })
}

export async function criarPersonalidadeIA(dados: Record<string, unknown>) {
  return criar('personalidade_ia', dados)
}

export async function atualizarPersonalidadeIA(id: number, dados: Record<string, unknown>) {
  return atualizar('personalidade_ia', id, dados)
}

// --- FAQ ---
export async function getFAQs(empresaId?: number, params?: QueryParams) {
  const empresaWhere = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  const where = empresaWhere && params?.where
    ? `${empresaWhere}~and${params.where}`
    : empresaWhere || params?.where
  return listar('faq', { ...params, where, sort: params?.sort || '-prioridade' })
}

export async function criarFAQ(dados: Record<string, unknown>) {
  return criar('faq', dados)
}

export async function atualizarFAQ(id: number, dados: Record<string, unknown>) {
  return atualizar('faq', id, dados)
}

export async function deletarFAQ(id: number) {
  return deletar('faq', id)
}

// --- CONVERSAS ---
export async function getConversas(empresaId?: number, params?: QueryParams) {
  const empresaWhere = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  const where = empresaWhere && params?.where
    ? `${empresaWhere}~and${params.where}`
    : empresaWhere || params?.where
  return listar('conversas', { ...params, where, sort: params?.sort || '-created_at' })
}

export async function getConversa(id: number) {
  return buscarPorId('conversas', id)
}

// --- MENSAGENS ---
export async function getMensagens(conversaId: number, params?: QueryParams) {
  const where = `(conversa_id,eq,${conversaId})`
  return listar('mensagens', { where, sort: 'created_at', limit: 100, ...params })
}

export async function deletarMensagensConversa(conversaId: number) {
  const mensagens = await getMensagens(conversaId, { limit: 1000 })
  if (mensagens.list.length === 0) return
  const ids = (mensagens.list as Array<{ id: number }>).map(m => ({ Id: m.id }))
  await api.delete(`/${TABLE_IDS.mensagens}`, { data: ids })
}

export async function atualizarConversa(id: number, dados: Record<string, unknown>) {
  return atualizar('conversas', id, dados)
}

// --- FOLLOWUPS ---
export async function getFollowups(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('followups', { where, sort: '-created_at', ...params })
}

export async function criarFollowup(dados: Record<string, unknown>) {
  return criar('followups', dados)
}

export async function atualizarFollowup(id: number, dados: Record<string, unknown>) {
  return atualizar('followups', id, dados)
}

export async function deletarFollowup(id: number) {
  return deletar('followups', id)
}

// --- TEMPLATES FOLLOWUP ---
export async function getTemplatesFollowup(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('templates_followup', { where, sort: 'ordem', ...params })
}

export async function criarTemplateFollowup(dados: Record<string, unknown>) {
  return criar('templates_followup', dados)
}

export async function atualizarTemplateFollowup(id: number, dados: Record<string, unknown>) {
  return atualizar('templates_followup', id, dados)
}

export async function deletarTemplateFollowup(id: number) {
  return deletar('templates_followup', id)
}

// --- EVENTOS FUNIL ---
export async function getEventosFunil(conversaId?: number, params?: QueryParams) {
  const where = conversaId ? `(conversa_id,eq,${conversaId})` : undefined
  return listar('eventos_funil', { where, sort: '-created_at', ...params })
}

// --- MÉTRICAS DIÁRIAS ---
export async function getMetricasDiarias(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('metricas_diarias', { where, sort: '-data', ...params })
}

// --- LOGS ERRO ---
export async function getLogsErro(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('logs_erro', { where, sort: '-created_at', ...params })
}

// --- CACHE RESPOSTAS ---
export async function getCacheRespostas(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('cache_respostas', { where, sort: '-vezes_usado', ...params })
}

// --- INTEGRAÇÕES ---
export async function getIntegracoes(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('integracoes', { where, ...params })
}

export async function criarIntegracao(dados: Record<string, unknown>) {
  return criar('integracoes', dados)
}

export async function atualizarIntegracao(id: number, dados: Record<string, unknown>) {
  return atualizar('integracoes', id, dados)
}

// --- PLANOS ---
export async function getPlanos(empresaId?: number, params?: QueryParams) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('planos', { where, sort: 'ordem', ...params })
}

// =====================================================
// ESTATÍSTICAS GERAIS (DASHBOARD)
// =====================================================

export async function getEstatisticasGerais(empresaId?: number) {
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  const empresaWhere = empresaId ? `(id,eq,${empresaId})` : undefined

  const [empresasRes, conversasRes, mensagensRes, faqsRes] = await Promise.all([
    listar('empresas', { limit: 1, where: empresaWhere }),
    listar('conversas', { limit: 1, where }),
    listar('mensagens', { limit: 1 }), // Mensagens não costuma ter empresa_id direto, mas sim via conversa_id em joins complexos. Para estatísticas simples, filtrar conversas já resolve o total de conversas.
    listar('faq', { limit: 1, where }),
  ])

  return {
    totalEmpresas: empresasRes.pageInfo.totalRows,
    totalConversas: conversasRes.pageInfo.totalRows,
    totalMensagens: mensagensRes.pageInfo.totalRows,
    totalFAQs: faqsRes.pageInfo.totalRows,
  }
}
