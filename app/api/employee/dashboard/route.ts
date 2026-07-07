import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/api-auth'
import { mapEmployee } from '@/lib/mappers'
import { calculateMonthlyLeaveSummary } from '@/lib/leavePolicy'

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
  }
}

export async function GET() {
  const { session, error } = await requireEmployee()
  if (error) return error

  const employeeId = session!.user.employeeId!
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [employee, leaves, todayAttendance] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    }),
  ])

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const leaveInputs = leaves.map((l) => ({
    fromDate: l.fromDate,
    toDate: l.toDate,
    days: Number(l.days),
    status: l.status,
  }))

  const paySummary = calculateMonthlyLeaveSummary(
    Number(employee.grossSalary),
    leaveInputs,
    undefined,
    undefined,
    employee.joiningDate,
    employee.createdAt
  )

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING')
  const recentLeaves = leaves.slice(0, 5).map(formatLeave)

  return NextResponse.json({
    employee: mapEmployee(employee),
    pay_summary: paySummary,
    today_attendance: todayAttendance
      ? {
          id: todayAttendance.id,
          date: todayAttendance.date.toISOString().split('T')[0],
          check_in: todayAttendance.checkIn.toISOString(),
          check_out: todayAttendance.checkOut?.toISOString() ?? null,
        }
      : null,
    pending_leave_count: pendingLeaves.length,
    recent_leaves: recentLeaves,
    all_leaves: leaves.map(formatLeave),
  })
}
