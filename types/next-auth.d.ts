import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
      canBeEmployee: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    canBeEmployee: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    canBeEmployee: boolean
  }
}