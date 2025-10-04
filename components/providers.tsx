"use client"

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/lib/auth-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CurrencyProvider>
          {children}
          <Toaster position="top-right" />
        </CurrencyProvider>
      </AuthProvider>
    </SessionProvider>
  )
}