import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/api-auth'
import { mapSettings } from '@/lib/mappers'
import { emptySettings } from '@/lib/utils'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const row = await prisma.settings.findFirst()
  return NextResponse.json(row ? mapSettings(row) : emptySettings)
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const payload = {
    companyName: body.company_name || null,
    address: body.address || null,
    email: body.email || null,
    phone: body.phone || null,
    website: body.website || null,
    signatoryName: body.signatory_name || null,
    signatoryDesignation: body.signatory_designation || null,
    logoUrl: body.logo_url || null,
    signatureUrl: body.signature_url || null,
    payslipCustomFields: body.payslip_custom_fields ?? [],
  }

  const existing = body.id
    ? await prisma.settings.findUnique({ where: { id: body.id } })
    : await prisma.settings.findFirst()

  const row = existing
    ? await prisma.settings.update({ where: { id: existing.id }, data: payload })
    : await prisma.settings.create({ data: payload })

  return NextResponse.json(mapSettings(row))
}
