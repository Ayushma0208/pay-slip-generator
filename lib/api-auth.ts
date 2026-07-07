import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, error: null }
}

export async function requireAdmin() {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (session!.user.role !== UserRole.ADMIN) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session, error: null }
}

export async function requireEmployee() {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (session!.user.role !== UserRole.EMPLOYEE || !session!.user.employeeId) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session, error: null }
}
