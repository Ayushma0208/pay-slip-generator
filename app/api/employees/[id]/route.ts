import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { mapEmployee } from '@/lib/mappers'
import { hashPassword } from '@/lib/password'

type RouteContext = { params: { id: string } }

export async function PUT(request: Request, { params }: RouteContext) {
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

  const existing = await prisma.employee.findUnique({
    where: { id: params.id },
    include: { user: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const gross = parseFloat(String(gross_salary))
  if (Number.isNaN(gross) || gross < 0) {
    return NextResponse.json({ error: 'Valid gross salary is required' }, { status: 400 })
  }

  const loginEmail = email?.trim() ? String(email).trim().toLowerCase() : existing.email

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: params.id },
        data: {
          name: name?.trim() ?? existing.name,
          employeeId: employee_id?.trim() ?? existing.employeeId,
          designation: designation ?? null,
          department: department ?? null,
          joiningDate: joining_date ? new Date(joining_date + 'T12:00:00') : null,
          email: loginEmail,
          phone: phone || null,
          bankName: bank_name || null,
          bankAccount: bank_account || null,
          panNumber: pan_number || null,
          pfNumber: pf_number || null,
          uan: uan || null,
          grossSalary: gross,
          paymentMode: payment_mode || existing.paymentMode,
        },
      })

      if (existing.user && loginEmail && loginEmail !== existing.user.email) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: { email: loginEmail },
        })
      }

      if (password && String(password).length >= 6 && existing.user) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: { passwordHash: await hashPassword(String(password)) },
        })
      }

      return updated
    })

    return NextResponse.json(mapEmployee(employee))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update employee'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    await prisma.employee.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}
