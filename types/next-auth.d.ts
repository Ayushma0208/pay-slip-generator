import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'ADMIN' | 'EMPLOYEE'
      employeeId: string | null
      employeeCode: string | null
    }
  }

  interface User {
    id: string
    email: string
    role: 'ADMIN' | 'EMPLOYEE'
    employeeId: string | null
    employeeCode: string | null
    name: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'ADMIN' | 'EMPLOYEE'
    employeeId?: string | null
    employeeCode?: string | null
    name?: string
  }
}

export type { NextAuthOptions }
