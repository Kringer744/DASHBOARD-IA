'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoading } from '@/components/ui/Loading'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return <PageLoading text="Iniciando sistema..." />
  }

  if (!user && pathname === '/login') {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {pathname !== '/login' && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
