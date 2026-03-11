import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import LayoutContent from '@/components/layout/LayoutContent'

export const metadata: Metadata = {
  title: 'Dashboard IA - Multi-empresa',
  description: 'Gerenciamento de IA multiempresa com NocoDB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-bg-primary text-white">
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
