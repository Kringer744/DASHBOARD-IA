import axios from 'axios'

// =====================================================
// CONFIGURAÇÃO DA API NOCODB
// =====================================================

const BASE_URL = process.env.NEXT_PUBLIC_NOCODB_URL || 'https://desk-nocodb.5y4hfw.easypanel.host'
const TOKEN = process.env.NEXT_PUBLIC_NOCODB_TOKEN || 'dfx-T6kTspesvooij0wJeYxQ7hBZmDe40RxYZiO8'
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID || 'pslvd73baqrfuhp'

// IDs das tabelas (coletados via API meta)
export const TABLE_IDS = {
  empresas: 'muajz8dygzqh90r',
  unidades: 'mpbtbwxzppkjahg',
  personalidade_ia: 'm1okfwmwh279if8',
  faq: 'msn0c2ac9u5xmju',
  conversas: 'm7vdzwixukr41xm',
  mensagens: 'mgjtci39oqgn6i9',
  followups: 'm57j5nsfr2fn22a',
  templates_followup: 'm7wb42fx292c9qr',
  eventos_funil: 'm19wn27q2a8vxu9',
  metricas_diarias: 'mpwi72gu8jmgmwx',
  logs_erro: 'ma8r7gy79tn6vrh',
  cache_respostas: 'mjy1lxbb9w8bl6x',
  integracoes: 'mcvonh8wkn671qs',
  planos: 'm1wnomstilwbr50',
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

  return response.data
}

export async function buscarPorId<T>(tabela: TableName, id: number): Promise<T> {
  const response = await api.get<T>(`/${TABLE_IDS[tabela]}/${id}`)
  return response.data
}

export async function criar<T>(tabela: TableName, dados: Partial<T>): Promise<T> {
  const response = await api.post<T>(`/${TABLE_IDS[tabela]}`, dados)
  return response.data
}

export async function atualizar<T>(
  tabela: TableName,
  id: number,
  dados: Partial<T>
): Promise<T> {
  const response = await api.patch<T>(`/${TABLE_IDS[tabela]}/${id}`, dados)
  return response.data
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
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('unidades', { where, sort: 'ordem_exibicao', ...params })
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
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('faq', { where, sort: '-prioridade', ...params })
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
  const where = empresaId ? `(empresa_id,eq,${empresaId})` : undefined
  return listar('conversas', { where, sort: '-created_at', ...params })
}

export async function getConversa(id: number) {
  return buscarPorId('conversas', id)
}

// --- MENSAGENS ---
export async function getMensagens(conversaId: number, params?: QueryParams) {
  const where = `(conversa_id,eq,${conversaId})`
  return listar('mensagens', { where, sort: 'created_at', limit: 100, ...params })
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

export async function getEstatisticasGerais() {
  const [empresasRes, conversasRes, mensagensRes, faqsRes] = await Promise.all([
    listar('empresas', { limit: 1 }),
    listar('conversas', { limit: 1 }),
    listar('mensagens', { limit: 1 }),
    listar('faq', { limit: 1 }),
  ])

  return {
    totalEmpresas: empresasRes.pageInfo.totalRows,
    totalConversas: conversasRes.pageInfo.totalRows,
    totalMensagens: mensagensRes.pageInfo.totalRows,
    totalFAQs: faqsRes.pageInfo.totalRows,
  }
}
