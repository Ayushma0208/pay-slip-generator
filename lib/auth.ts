import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
            include: { employee: true },
          })

          if (!user) return null

          const valid = await verifyPassword(credentials.password, user.passwordHash)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            employeeCode: user.employee?.employeeId ?? null,
            name: user.employee?.name ?? user.email,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employeeId = user.employeeId
        token.employeeCode = user.employeeCode
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.employeeId = (token.employeeId as string | null) ?? null
        session.user.employeeCode = (token.employeeCode as string | null) ?? null
        session.user.name = (token.name as string) ?? session.user.email ?? ''
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export type AppSessionUser = {
  id: string
  email: string
  role: UserRole
  employeeId: string | null
  employeeCode: string | null
  name: string
}

export function getTokenUser(token: JWT | null): AppSessionUser | null {
  if (!token?.id || !token.email) return null
  return {
    id: token.id as string,
    email: token.email as string,
    role: token.role as UserRole,
    employeeId: (token.employeeId as string | null) ?? null,
    employeeCode: (token.employeeCode as string | null) ?? null,
    name: (token.name as string) ?? (token.email as string),
  }
}
