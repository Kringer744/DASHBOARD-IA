'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  email: string
  empresaId: number
  empresaNome: string
  empresaUuid: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mapeamento inicial de usuários (será expandido conforme novos clientes entrarem)
const USERS_MAP: Record<string, { senha: string; empresaId: number; empresaNome: string; empresaUuid: string }> = {
  'cleiton.nso2019@gmail.com': {
    senha: 'Redteste12@',
    empresaId: 1, // ID correto da Red Fitness no NocoDB conforme inspeção
    empresaNome: 'Red Fitness',
    empresaUuid: '9d34fe71-d5f4-4e0e-b76e-95921e50cef1'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Restaurar sessão do localStorage
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    const userData = USERS_MAP[email]
    
    if (userData && userData.senha === senha) {
      const newUser = {
        email,
        empresaId: userData.empresaId,
        empresaNome: userData.empresaNome,
        empresaUuid: userData.empresaUuid
      }
      setUser(newUser)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      router.push('/')
      return true
    }
    
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
