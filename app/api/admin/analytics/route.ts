import { NextResponse } from 'next/server'
import { LeaveStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const today = startOfDay(new Date())
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const [
    totalEmployees,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    todayAttendance,
    attendanceRecords,
    leaveRequests,
    employeesByDept,
    totalPayroll,
    recentLeaves,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.APPROVED } }),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.REJECTED } }),
    prisma.attendanceRecord.count({ where: { date: today } }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: sevenDaysAgo, lte: today } },
      select: { date: true },
    }),
    prisma.leaveRequest.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { leaveType: true, status: true, days: true, createdAt: true },
    }),
    prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
    }),
    prisma.employee.aggregate({ _sum: { grossSalary: true } }),
    prisma.leaveRequest.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { name: true, employeeId: true } } },
    }),
  ])

  const attendanceByDay: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    attendanceByDay[toDateKey(d)] = 0
  }
  for (const r of attendanceRecords) {
    const key = toDateKey(r.date)
    if (key in attendanceByDay) attendanceByDay[key]++
  }

  const leaveByType: Record<string, number> = {}
  const leaveDaysByMonth: Record<string, number> = {}
  for (const l of leaveRequests) {
    leaveByType[l.leaveType] = (leaveByType[l.leaveType] || 0) + 1
    const monthKey = l.createdAt.toISOString().slice(0, 7)
    leaveDaysByMonth[monthKey] =
      (leaveDaysByMonth[monthKey] || 0) + Number(l.days)
  }

  const absentToday = Math.max(0, totalEmployees - todayAttendance)

  return NextResponse.json({
    kpis: {
      totalEmployees,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      todayAttendance,
      absentToday,
      monthlyPayroll: Number(totalPayroll._sum.grossSalary ?? 0),
      attendanceRate:
        totalEmployees > 0
          ? Math.round((todayAttendance / totalEmployees) * 100)
          : 0,
    },
    attendanceTrend: Object.entries(attendanceByDay).map(([date, count]) => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
      }),
      count,
    })),
    leaveByStatus: [
      { status: 'Pending', count: pendingLeaves },
      { status: 'Approved', count: approvedLeaves },
      { status: 'Rejected', count: rejectedLeaves },
    ],
    leaveByType: Object.entries(leaveByType).map(([type, count]) => ({ type, count })),
    departmentBreakdown: employeesByDept
      .map((d) => ({
        department: d.department || 'Unassigned',
        count: d._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    recentLeaves: recentLeaves.map((l) => ({
      id: l.id,
      employee: l.employee.name,
      employee_id: l.employee.employeeId,
      leave_type: l.leaveType,
      days: Number(l.days),
      status: l.status,
      created_at: l.createdAt.toISOString(),
    })),
  })
}
