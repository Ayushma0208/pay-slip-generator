import type { Employee as PrismaEmployee, Settings as PrismaSettings } from '@prisma/client'
import type { Employee, PayslipCustomField, Settings } from '@/types'

export function mapEmployee(row: PrismaEmployee): Employee {
  return {
    id: row.id,
    name: row.name,
    employee_id: row.employeeId,
    designation: row.designation ?? '',
    department: row.department ?? '',
    joining_date: row.joiningDate ? row.joiningDate.toISOString().split('T')[0] : '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    bank_name: row.bankName ?? '',
    bank_account: row.bankAccount ?? '',
    pan_number: row.panNumber ?? '',
    pf_number: row.pfNumber ?? '',
    uan: row.uan ?? '',
    gross_salary: Number(row.grossSalary),
    payment_mode: row.paymentMode,
  }
}

export function parsePayslipCustomFields(raw: unknown): PayslipCustomField[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        label: String(row.label ?? '').trim(),
        value: String(row.value ?? '').trim(),
      }
    })
    .filter((row): row is PayslipCustomField => row !== null)
}

export function mapSettings(row: PrismaSettings): Settings {
  return {
    id: row.id,
    company_name: row.companyName ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    website: row.website ?? '',
    signatory_name: row.signatoryName ?? '',
    signatory_designation: row.signatoryDesignation ?? '',
    logo_url: row.logoUrl ?? '',
    signature_url: row.signatureUrl ?? '',
    payslip_custom_fields: parsePayslipCustomFields(row.payslipCustomFields),
  }
}
