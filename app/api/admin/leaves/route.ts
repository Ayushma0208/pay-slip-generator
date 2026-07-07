import { NextResponse } from 'next/server'
import { LeaveStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
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

/** Admin: backfill past leave records (e.g. April–June before app was used) */
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const {
    employee_id,
    leave_type,
    from_date,
    to_date,
    reason,
    admin_note,
    half_day,
    status = 'APPROVED',
  } = body

  if (!employee_id || !leave_type || !from_date || !to_date) {
    return NextResponse.json(
      { error: 'Employee, leave type, and dates are required' },
      { status: 400 }
    )
  }

  if (!['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const employee = await prisma.employee.findUnique({ where: { id: employee_id } })
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  let days = calculateLeaveDays(from_date, to_date)
  if (half_day && from_date === to_date) {
    days = 0.5
  }
  if (days <= 0) {
    return NextResponse.json({ error: 'To date must be on or after from date' }, { status: 400 })
  }

  const row = await prisma.leaveRequest.create({
    data: {
      employeeId: employee_id,
      leaveType: String(leave_type),
      fromDate: new Date(from_date + 'T12:00:00'),
      toDate: new Date(to_date + 'T12:00:00'),
      days,
      reason: reason || null,
      status: status as LeaveStatus,
      adminNote: admin_note || 'Historical record added by admin',
      reviewedAt: status === 'APPROVED' || status === 'REJECTED' ? new Date() : null,
    },
    include: { employee: true },
  })

  return NextResponse.json(formatLeave(row), { status: 201 })
}
