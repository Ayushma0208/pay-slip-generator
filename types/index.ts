import type { SalaryCalculation, SalaryLineItem } from '@/lib/salaryCalc'

export interface Employee {
  id: string
  name: string
  employee_id: string
  designation: string
  department: string
  joining_date: string
  email: string
  phone: string
  bank_name: string
  bank_account: string
  pan_number: string
  pf_number: string
  uan: string
  gross_salary: number
  payment_mode: string
}

/** Admin-defined label/value rows shown on every payslip (Settings) */
export interface PayslipCustomField {
  label: string
  value: string
}

export interface Settings {
  id: string
  company_name: string
  address: string
  email: string
  phone: string
  website: string
  signatory_name: string
  signatory_designation: string
  logo_url: string
  signature_url: string
  payslip_custom_fields: PayslipCustomField[]
}

export interface CustomDeduction {
  label: string
  amount: number
}

export type Reimbursement = SalaryLineItem

export type PayslipTemplateId = 1 | 2 | 3 | 4

export interface PayslipPreviewProps {
  employee: Employee | null
  settings: Settings
  calc: SalaryCalculation | null
  month: string
  year: string
  showTaxPage: boolean
  customDeductions: CustomDeduction[]
  payDate: string
  fromDate: string
  toDate: string
}

export interface PayslipData {
  month: string
  year: string
  from_date: string
  to_date: string
  lop_days: number
  pay_date: string
  overtime_hours: number
  final_settlement: number
  custom_deductions: CustomDeduction[]
  reimbursements: Reimbursement[]
  showTaxPage: boolean
  selectedTemplate: PayslipTemplateId
}

export interface LetterData {
  letter_type: 'relieving' | 'experience'
  letter_date: string
  last_working_date: string
}
