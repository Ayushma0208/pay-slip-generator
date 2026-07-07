import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/api-auth'
import { calculateLeaveDays } from '@/lib/utils'

function formatLeave(row: {
  id: string
  leaveType: string
  fromDate: Date
  toDate: Date
  days: { toString(): string }
  reason: string | null
  status: string
  adminNote: string | null
  reviewedAt: Date | null
  createdAt: Date
  employee: { id: string; name: string; employeeId: string }
}) {
  return {
    id: row.id,
    leave_type: row.leaveType,
    from_date: row.fromDate.toISOString().split('T')[0],
    to_date: row.toDate.toISOString().split('T')[0],
    days: Number(row.days),
    reason: row.reason,
    status: row.status,
    admin_note: row.adminNote,
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    employee: {
      id: row.employee.id,
      name: row.employee.name,
      employee_id: row.employee.employeeId,
    },
  }
}

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error

  const where =
    session!.user.role === UserRole.ADMIN
      ? {}
      : { employeeId: session!.user.employeeId! }

  const rows = await prisma.leaveRequest.findMany({
    where,
    include: { employee: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(rows.map(formatLeave))
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  if (session!.user.role !== UserRole.EMPLOYEE || !session!.user.employeeId) {
    return NextResponse.json({ error: 'Only employees can submit leave requests' }, { status: 403 })
  }

  const body = await request.json()
  const { leave_type, from_date, to_date, reason } = body

  if (!leave_type || !from_date || !to_date) {
    return NextResponse.json({ error: 'Leave type and dates are required' }, { status: 400 })
  }

  const days = calculateLeaveDays(from_date, to_date)
  if (days <= 0) {
    return NextResponse.json({ error: 'To date must be on or after from date' }, { status: 400 })
  }

  const row = await prisma.leaveRequest.create({
    data: {
      employeeId: session!.user.employeeId,
      leaveType: String(leave_type),
      fromDate: new Date(from_date + 'T12:00:00'),
      toDate: new Date(to_date + 'T12:00:00'),
      days,
      reason: reason || null,
    },
    include: { employee: true },
  })

  return NextResponse.json(formatLeave(row), { status: 201 })
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { id, status, admin_note } = body

  if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 })
  }

  const row = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      adminNote: admin_note || null,
      reviewedAt: new Date(),
    },
    include: { employee: true },
  })

  return NextResponse.json(formatLeave(row))
}
