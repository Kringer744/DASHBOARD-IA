import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// =====================================================
// UTILITÁRIOS DE CLASSE
// =====================================================

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// =====================================================
// FORMATAÇÃO DE DATAS
// =====================================================

export function formatarData(data: string | Date | null | undefined): string {
  if (!data) return '-'
  try {
    const d = typeof data === 'string' ? parseISO(data) : data
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatarDataCurta(data: string | Date | null | undefined): string {
  if (!data) return '-'
  try {
    const d = typeof data === 'string' ? parseISO(data) : data
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatarDataRelativa(data: string | Date | null | undefined): string {
  if (!data) return '-'
  try {
    const d = typeof data === 'string' ? parseISO(data) : data
    return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
  } catch {
    return '-'
  }
}

// =====================================================
// FORMATAÇÃO DE VALORES
// =====================================================

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarNumero(num: number | null | undefined): string {
  if (num == null) return '0'
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function formatarPorcentagem(valor: number | null | undefined, decimais = 1): string {
  if (valor == null) return '0%'
  return `${valor.toFixed(decimais)}%`
}

// =====================================================
// LABELS E STATUS
// =====================================================

export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
  open: 'Aberto',
  closed: 'Fechado',
  pending: 'Pendente',
  resolved: 'Resolvido',
  sent: 'Enviado',
  failed: 'Falhou',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  inactive: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  suspended: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  open: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  closed: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  pending: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  resolved: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  sent: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  failed: 'text-accent-red bg-accent-red/10 border-accent-red/20',
  cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
}

export const PLANO_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLANO_COLORS: Record<string, string> = {
  free: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  basic: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  pro: 'text-brand-400 bg-brand-400/10 border-brand-400/20',
  enterprise: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
}

export const MODELO_IA_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI GPT',
  auto: 'Automático',
}

// =====================================================
// HELPERS GERAIS
// =====================================================

export function truncarTexto(texto: string, maxLength = 100): string {
  if (!texto) return ''
  if (texto.length <= maxLength) return texto
  return texto.substring(0, maxLength) + '...'
}

export function getIniciais(nome: string): string {
  if (!nome) return '?'
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function gerarCorAvatar(str: string): string {
  const cores = [
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-teal-500 to-cyan-500',
  ]
  const index = str.charCodeAt(0) % cores.length
  return cores[index]
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
