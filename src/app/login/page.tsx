'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(email, senha)
      if (!success) {
        setError('E-mail ou senha incorretos.')
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 bg-purple-glow">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-bg-secondary border border-bg-border rounded-2xl flex items-center justify-center mb-4 shadow-glow">
            <img src="/fluxo-logo.svg" alt="Fluxo" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard IA</h1>
          <p className="text-gray-400 text-sm mt-1">Gestão inteligente para sua empresa</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="input-field pl-11"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  className="input-field pl-11"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-lg py-3 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Fluxo Digital & Tech. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
