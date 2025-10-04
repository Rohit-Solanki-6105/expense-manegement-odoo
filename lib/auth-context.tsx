"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  canBeEmployee: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => boolean
  canActAsEmployee: () => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasRole: () => false,
  canActAsEmployee: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id || '',
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        canBeEmployee: session.user.canBeEmployee,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const hasRole = (role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => {
    return user?.role === role
  }

  const canActAsEmployee = () => {
    return user?.role === 'MANAGER' && user?.canBeEmployee === true
  }

  const value: AuthContextType = {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    hasRole,
    canActAsEmployee,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}