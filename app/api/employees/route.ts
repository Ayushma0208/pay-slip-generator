import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { mapEmployee } from '@/lib/mappers'
import { hashPassword } from '@/lib/password'
import { calculateMonthlyLeaveSummary, type LeaveRecordInput } from '@/lib/leavePolicy'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const rows = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    include: { leaveRequests: true },
  })

  return NextResponse.json(
    rows.map((row) => {
      const leaveInputs: LeaveRecordInput[] = row.leaveRequests.map((l) => ({
        fromDate: l.fromDate,
        toDate: l.toDate,
        days: Number(l.days),
        status: l.status,
      }))

      return {
        ...mapEmployee(row),
        pay_summary: calculateMonthlyLeaveSummary(
          Number(row.grossSalary),
          leaveInputs,
          undefined,
          undefined,
          row.joiningDate,
          row.createdAt
        ),
      }
    })
  )
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const {
    name,
    employee_id,
    designation,
    department,
    joining_date,
    email,
    phone,
    bank_name,
    bank_account,
    pan_number,
    pf_number,
    uan,
    gross_salary,
    payment_mode,
    password,
  } = body

  if (!name?.trim() || !employee_id?.trim()) {
    return NextResponse.json({ error: 'Name and Employee ID are required' }, { status: 400 })
  }
  if (!password || String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required for employee login' }, { status: 400 })
  }

  const gross = parseFloat(String(gross_salary))
  if (Number.isNaN(gross) || gross < 0) {
    return NextResponse.json({ error: 'Valid gross salary is required' }, { status: 400 })
  }

  const loginEmail = String(email).trim().toLowerCase()

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          name: name.trim(),
          employeeId: employee_id.trim(),
          designation: designation || null,
          department: department || null,
          joiningDate: joining_date ? new Date(joining_date + 'T12:00:00') : null,
          email: loginEmail,
          phone: phone || null,
          bankName: bank_name || null,
          bankAccount: bank_account || null,
          panNumber: pan_number || null,
          pfNumber: pf_number || null,
          uan: uan || null,
          grossSalary: gross,
          paymentMode: payment_mode || 'Bank Transfer',
        },
      })

      await tx.user.create({
        data: {
          email: loginEmail,
          passwordHash: await hashPassword(String(password)),
          role: 'EMPLOYEE',
          employeeId: created.id,
        },
      })

      return created
    })

    return NextResponse.json(mapEmployee(employee), { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create employee'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
