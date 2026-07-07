import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatRecord(row: {
  id: string
  date: Date
  checkIn: Date
  checkOut: Date | null
  notes: string | null
  employee: { id: string; name: string; employeeId: string }
}) {
  return {
    id: row.id,
    date: row.date.toISOString().split('T')[0],
    check_in: row.checkIn.toISOString(),
    check_out: row.checkOut?.toISOString() ?? null,
    notes: row.notes,
    employee: {
      id: row.employee.id,
      name: row.employee.name,
      employee_id: row.employee.employeeId,
    },
  }
}

export async function GET(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const employeeIdParam = searchParams.get('employee_id')

  let where: { employeeId?: string } = {}

  if (session!.user.role === UserRole.ADMIN) {
    if (employeeIdParam) {
      where = { employeeId: employeeIdParam }
    }
  } else {
    where = { employeeId: session!.user.employeeId! }
  }

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (from) dateFilter.gte = new Date(from + 'T00:00:00')
  if (to) dateFilter.lte = new Date(to + 'T23:59:59')

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      ...where,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    include: { employee: true },
    orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
  })

  return NextResponse.json(rows.map(formatRecord))
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const action = body.action as 'check-in' | 'check-out'

  if (session!.user.role !== UserRole.EMPLOYEE || !session!.user.employeeId) {
    return NextResponse.json({ error: 'Only employees can check in/out' }, { status: 403 })
  }

  const employeeId = session!.user.employeeId
  const today = startOfToday()
  const now = new Date()

  if (action === 'check-in') {
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 409 })
    }

    const row = await prisma.attendanceRecord.create({
      data: { employeeId, date: today, checkIn: now },
      include: { employee: true },
    })
    return NextResponse.json(formatRecord(row), { status: 201 })
  }

  if (action === 'check-out') {
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
      include: { employee: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Check in first before checking out' }, { status: 400 })
    }
    if (existing.checkOut) {
      return NextResponse.json({ error: 'Already checked out today' }, { status: 409 })
    }

    const row = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
      include: { employee: true },
    })
    return NextResponse.json(formatRecord(row))
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
