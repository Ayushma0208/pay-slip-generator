import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { hashPassword } from '@/lib/password'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { employees, defaultPassword } = body as {
    employees: Array<Record<string, unknown>>
    defaultPassword?: string
  }

  if (!Array.isArray(employees) || employees.length === 0) {
    return NextResponse.json({ error: 'No employees to import' }, { status: 400 })
  }

  const password = defaultPassword || 'Employee@123'
  if (password.length < 6) {
    return NextResponse.json({ error: 'Default password must be at least 6 characters' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  let imported = 0
  const errors: string[] = []

  for (const row of employees) {
    const name = String(row.name ?? '').trim()
    const employeeId = String(row.employee_id ?? row.employeeId ?? '').trim()
    const email = String(row.email ?? '').trim().toLowerCase()

    if (!name || !employeeId) {
      errors.push(`Skipped row: missing name or employee ID`)
      continue
    }
    if (!email) {
      errors.push(`Skipped ${name}: email required for login`)
      continue
    }

    const gross = parseFloat(String(row.gross_salary ?? row.grossSalary ?? 0)) || 0

    try {
      await prisma.$transaction(async (tx) => {
        const created = await tx.employee.create({
          data: {
            name,
            employeeId,
            designation: String(row.designation ?? '') || null,
            department: String(row.department ?? '') || null,
            joiningDate: row.joining_date
              ? new Date(String(row.joining_date) + 'T12:00:00')
              : null,
            email,
            phone: String(row.phone ?? '') || null,
            bankName: String(row.bank_name ?? '') || null,
            bankAccount: String(row.bank_account ?? '') || null,
            panNumber: String(row.pan_number ?? '') || null,
            pfNumber: String(row.pf_number ?? '') || null,
            uan: String(row.uan ?? '') || null,
            grossSalary: gross,
            paymentMode: String(row.payment_mode ?? 'Bank Transfer'),
          },
        })

        await tx.user.create({
          data: {
            email,
            passwordHash,
            role: 'EMPLOYEE',
            employeeId: created.id,
          },
        })
      })
      imported++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Skipped ${employeeId}: ${msg.includes('Unique') ? 'duplicate' : msg}`)
    }
  }

  return NextResponse.json({ imported, errors })
}
