'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
import { ArrowLeft, Bot, User, Clock, MessageSquare, Star, Phone, Mail, Trash2 } from 'lucide-react'
import { getConversa, getMensagens, deletarMensagensConversa } from '@/lib/nocodb'
import { ConfirmModal } from '@/components/ui/Modal'
import type { Conversa, Mensagem } from '@/types'
import { formatarData, formatarDataRelativa } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ConversaDetalhe() {
  const { id } = useParams()
  const router = useRouter()
  const [conversa, setConversa] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmLimpar, setConfirmLimpar] = useState(false)
  const [limpando, setLimpando] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const [c, m] = await Promise.all([
          getConversa(parseInt(id as string)),
          getMensagens(parseInt(id as string)),
        ])
        setConversa(c as Conversa)
        setMensagens(m.list as Mensagem[])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  async function limparHistorico() {
    if (!id) return
    setLimpando(true)
    try {
      await deletarMensagensConversa(parseInt(id as string))
      setMensagens([])
      setConfirmLimpar(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLimpando(false)
    }
  }

  if (loading) return <PageLoading text="Carregando conversa..." />
  if (!conversa) return (
    <div className="p-6 text-center text-gray-400">Conversa não encontrada</div>
  )

  return (
    <div className="animate-fade">
      <Header
        title={`Conversa: ${conversa.contato_nome}`}
        subtitle={`ID: ${conversa.conversation_id || conversa.id}`}
        actions={
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mensagens - Coluna principal */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="px-5 py-4 border-b border-bg-border flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <h3 className="font-semibold text-white flex-1">
                Mensagens ({mensagens.length})
              </h3>
              {mensagens.length > 0 && (
                <button
                  onClick={() => setConfirmLimpar(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-red hover:bg-accent-red/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Histórico
                </button>
              )}
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {mensagens.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhuma mensagem encontrada</p>
              ) : (
                mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                      msg.role === 'assistant'
                        ? 'bg-brand-600/20 border border-brand-500/30'
                        : 'bg-bg-elevated border border-bg-border'
                    )}>
                      {msg.role === 'assistant'
                        ? <Bot className="w-4 h-4 text-brand-400" />
                        : <User className="w-4 h-4 text-gray-400" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={cn(
                      'max-w-[80%] space-y-1',
                      msg.role === 'assistant' ? 'items-start' : 'items-end'
                    )}>
                      <div className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm',
                        msg.role === 'assistant'
                          ? 'bg-bg-elevated text-gray-200 rounded-tl-sm'
                          : 'bg-brand-600/20 border border-brand-500/20 text-white rounded-tr-sm'
                      )}>
                        {msg.conteudo}
                      </div>
                      <div className={cn(
                        'flex items-center gap-2 text-xs text-gray-500',
                        msg.role !== 'assistant' && 'flex-row-reverse'
                      )}>
                        <span>{formatarDataRelativa(msg.created_at)}</span>
                        {msg.tokens_estimados && (
                          <span>{msg.tokens_estimados} tokens</span>
                        )}
                        {msg.tempo_resposta && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{msg.tempo_resposta}ms
                          </span>
                        )}
                        {msg.feedback_usuario && (
                          <Star className={cn(
                            'w-3 h-3',
                            msg.feedback_usuario === 'positive' ? 'text-accent-yellow' : 'text-gray-500'
                          )} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info do contato - Coluna lateral */}
        <div className="space-y-4">
          {/* Info da conversa */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Informações</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <StatusBadge status={conversa.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Contato</p>
                <p className="text-sm font-medium text-white">{conversa.contato_nome}</p>
              </div>
              {conversa.contato_telefone && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  {conversa.contato_telefone}
                </div>
              )}
              {conversa.contato_email && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  {conversa.contato_email}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Canal</p>
                <Badge variant="info">{conversa.canal || 'WhatsApp'}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Iniciada</p>
                <p className="text-sm text-gray-300">{formatarData(conversa.created_at)}</p>
              </div>
              {conversa.encerrada_em && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Encerrada</p>
                  <p className="text-sm text-gray-300">{formatarData(conversa.encerrada_em)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Métricas */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Métricas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Msgs Usuário', value: conversa.total_mensagens_cliente, color: 'text-white' },
                { label: 'Msgs IA', value: conversa.total_mensagens_ia, color: 'text-brand-400' },
                { label: 'Score', value: conversa.score_interesse, color: 'text-accent-yellow' },
                { label: 'T. Resposta', value: conversa.tempo_medio_resposta ? `${conversa.tempo_medio_resposta}s` : '-', color: 'text-accent-blue' },
              ].map((item) => (
                <div key={item.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                  <p className={cn('text-xl font-bold', item.color)}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3">Qualificação</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Lead Qualificado</span>
                <Badge variant={conversa.lead_qualificado ? 'success' : 'default'}>
                  {conversa.lead_qualificado ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Conversão</span>
                <Badge variant={conversa.conversao_detectada ? 'success' : 'default'}>
                  {conversa.conversao_detectada ? 'Detectada' : 'Não'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tags */}
          {conversa.tags && Array.isArray(conversa.tags) && conversa.tags.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {conversa.tags.map((tag, i) => (
                  <Badge key={i} variant="purple">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmLimpar}
        onClose={() => setConfirmLimpar(false)}
        onConfirm={limparHistorico}
        title="Limpar Histórico"
        message={`Tem certeza que deseja apagar todas as ${mensagens.length} mensagens desta conversa? Esta ação não pode ser desfeita.`}
        confirmLabel="Limpar Tudo"
        loading={limpando}
      />
    </div>
  )
}
