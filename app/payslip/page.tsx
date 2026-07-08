'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import { calculateSalary, getDefaultMedicalAllowance, getDefaultPfAmount } from '@/lib/salaryCalc'
import { downloadPayslipPdf } from '@/lib/downloadPayslip'
import { countWorkingDaysInRange } from '@/lib/workingDays'
import { getErrorMessage, MONTHS, getMonthDateRange } from '@/lib/utils'
import { calculateMonthlyLeaveSummary, type LeaveRecordInput } from '@/lib/leavePolicy'
import {
  buildLeaveDetailsTable,
  type LeaveRecordWithType,
} from '@/lib/leaveDetails'
import PayslipPreviewT4 from '@/components/PayslipPreviewT4'
import type { CustomDeduction, Employee, PayslipData, PayslipTemplateId, Reimbursement } from '@/types'
import EmployeeSearch from '@/components/EmployeeSearch'
import PayslipPreview from '@/components/PayslipPreview'
import PayslipPreviewT2 from '@/components/PayslipPreviewT2'
import PayslipPreviewT3 from '@/components/PayslipPreviewT3'
import DocumentPreviewFrame from '@/components/DocumentPreviewFrame'
import PrintButton from '@/components/PrintButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DOCUMENT_FONTS, DEFAULT_DOCUMENT_FONT } from '@/lib/documentFonts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function mapEmployee(row: Employee): Employee {
  return row
}

const currentYear = new Date().getFullYear()
const currentMonth = MONTHS[new Date().getMonth()]
const today = new Date().toISOString().split('T')[0]
const initialRange = getMonthDateRange(currentMonth, String(currentYear))

const defaultPayslip = (): PayslipData => ({
  month: currentMonth,
  year: String(currentYear),
  from_date: initialRange.from_date,
  to_date: initialRange.to_date,
  lop_days: 0,
  pay_date: today,
  final_settlement: 0,
  custom_deductions: [],
  reimbursements: [],
  showTaxPage: false,
  selectedTemplate: 4,
  medical_allowance: null,
  pf_amount: null,
})

const TEMPLATES: {
  id: PayslipTemplateId
  tag: string
  name: string
  desc: string
}[] = [
  { id: 4, tag: 'T4', name: 'Corporate Detailed', desc: 'Full Breakdown' },
  { id: 1, tag: 'T1', name: 'Corporate Standard', desc: 'Classic Format' },
  { id: 2, tag: 'T2', name: 'Minimal Elegant', desc: 'Clean & Formal' },
  { id: 3, tag: 'T3', name: 'Modern Corporate', desc: 'Bold & Modern' },
]

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="mb-3 border-b border-border pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {title}
    </p>
  )
}

export default function PayslipPage() {
  const { settings } = useSettings()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee | null>(null)
  const [payslip, setPayslip] = useState<PayslipData>(defaultPayslip)
  const [generated, setGenerated] = useState(false)
  const [showTaxPage, setShowTaxPage] = useState(false)
  const [leaveSummary, setLeaveSummary] = useState<ReturnType<typeof calculateMonthlyLeaveSummary> | null>(null)
  const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRecordWithType[]>([])
  const [policyDates, setPolicyDates] = useState<{
    joiningDate: Date | null
    createdAt: Date | null
  }>({ joiningDate: null, createdAt: null })
  const [downloading, setDownloading] = useState(false)
  const [documentFont, setDocumentFont] = useState<string>(
    settings.document_font || DEFAULT_DOCUMENT_FONT
  )

  // Keep the local font selector in sync with saved Settings on first load.
  useEffect(() => {
    setDocumentFont(settings.document_font || DEFAULT_DOCUMENT_FONT)
  }, [settings.document_font])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to load employees')
      const data = await res.json()
      setEmployees(data.map(mapEmployee))
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load employees'))
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const loadLeaveSummary = useCallback(async (emp: Employee, month: string, year: string) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`)
      if (!res.ok) return
      const data = await res.json()
      const monthIndex = MONTHS.indexOf(month as (typeof MONTHS)[number])
      const y = parseInt(year, 10) || new Date().getFullYear()
      const m = monthIndex >= 0 ? monthIndex : new Date().getMonth()

      const leaveInputs: LeaveRecordInput[] = (data.leaves ?? []).map(
        (l: { from_date: string; to_date: string; days: number; status: string; leave_type: string }) => ({
          fromDate: new Date(l.from_date + 'T12:00:00'),
          toDate: new Date(l.to_date + 'T12:00:00'),
          days: l.days,
          status: l.status,
          leaveType: l.leave_type,
        })
      )

      const joiningDate = data.employee?.joining_date
        ? new Date(data.employee.joining_date + 'T12:00:00')
        : null
      const createdAt = data.created_at ? new Date(data.created_at) : null

      setEmployeeLeaves(leaveInputs as LeaveRecordWithType[])
      setPolicyDates({ joiningDate, createdAt })

      const summary = calculateMonthlyLeaveSummary(
        Number(emp.gross_salary),
        leaveInputs,
        y,
        m,
        joiningDate,
        createdAt
      )
      setLeaveSummary(summary)
      setPayslip((prev) => ({ ...prev, lop_days: summary.excessLeaveDays }))
      setGenerated(false)
    } catch {
      setLeaveSummary(null)
      setEmployeeLeaves([])
      setPolicyDates({ joiningDate: null, createdAt: null })
    }
  }, [])

  useEffect(() => {
    if (!selected) {
      setLeaveSummary(null)
      setEmployeeLeaves([])
      setPolicyDates({ joiningDate: null, createdAt: null })
      return
    }
    loadLeaveSummary(selected, payslip.month, payslip.year)
  }, [selected, payslip.month, payslip.year, loadLeaveSummary])

  const updatePayslip = <K extends keyof PayslipData>(key: K, value: PayslipData[K]) => {
    setPayslip((prev) => ({ ...prev, [key]: value }))
    setGenerated(false)
  }

  const setMonthYear = (month: string, year: string) => {
    const range = getMonthDateRange(month, year)
    setPayslip((prev) => ({
      ...prev,
      month,
      year,
      from_date: range.from_date,
      to_date: range.to_date,
    }))
    setGenerated(false)
  }

  const addDeduction = () => {
    setPayslip((prev) => ({
      ...prev,
      custom_deductions: [...prev.custom_deductions, { label: '', amount: 0 }],
    }))
    setGenerated(false)
  }

  const updateDeduction = (index: number, field: keyof CustomDeduction, value: string | number) => {
    setPayslip((prev) => {
      const next = [...prev.custom_deductions]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, custom_deductions: next }
    })
    setGenerated(false)
  }

  const removeDeduction = (index: number) => {
    setPayslip((prev) => ({
      ...prev,
      custom_deductions: prev.custom_deductions.filter((_, i) => i !== index),
    }))
    setGenerated(false)
  }

  const addReimbursement = () => {
    setPayslip((prev) => ({
      ...prev,
      reimbursements: [...prev.reimbursements, { label: '', amount: 0 }],
    }))
    setGenerated(false)
  }

  const updateReimbursement = (
    index: number,
    field: keyof Reimbursement,
    value: string | number
  ) => {
    setPayslip((prev) => {
      const next = [...prev.reimbursements]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, reimbursements: next }
    })
    setGenerated(false)
  }

  const removeReimbursement = (index: number) => {
    setPayslip((prev) => ({
      ...prev,
      reimbursements: prev.reimbursements.filter((_, i) => i !== index),
    }))
    setGenerated(false)
  }

  const salaryCalc =
    selected && payslip.from_date && payslip.to_date
      ? calculateSalary(
          Number(selected.gross_salary),
          payslip.from_date,
          payslip.to_date,
          payslip.lop_days,
          payslip.custom_deductions,
          {
            finalSettlement: payslip.final_settlement,
            reimbursements: payslip.reimbursements,
            medicalAllowance: payslip.medical_allowance,
            pfAmount: payslip.pf_amount,
          }
        )
      : null

  const monthIndex = MONTHS.indexOf(payslip.month as (typeof MONTHS)[number])
  const payslipYear = parseInt(payslip.year, 10) || new Date().getFullYear()
  const payslipMonth = monthIndex >= 0 ? monthIndex : new Date().getMonth()

  const leaveDetails =
    leaveSummary && selected
      ? buildLeaveDetailsTable(
          employeeLeaves,
          leaveSummary,
          payslipYear,
          payslipMonth,
          policyDates.joiningDate,
          policyDates.createdAt
        )
      : []

  const previewProps = {
    employee: selected,
    settings,
    calc: salaryCalc,
    month: payslip.month,
    year: payslip.year,
    showTaxPage,
    customDeductions: payslip.custom_deductions,
    payDate: payslip.pay_date,
    fromDate: payslip.from_date,
    toDate: payslip.to_date,
    leaveDetails,
    documentFontOverride: documentFont,
  }

  const workingDaysInPeriod =
    payslip.from_date && payslip.to_date
      ? countWorkingDaysInRange(payslip.from_date, payslip.to_date)
      : null

  const handleGenerate = async () => {
    if (!selected) {
      toast.error('Please select an employee')
      return
    }
    if (!payslip.from_date || !payslip.to_date) {
      toast.error('Please set pay period dates')
      return
    }
    setGenerated(true)
    setDownloading(true)
    toast.success('Payslip generated')

    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const filename = `Payslip_${selected.employee_id}_${payslip.month}_${payslip.year}.pdf`
      await downloadPayslipPdf(filename)
      toast.success('Payslip downloaded')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to download payslip'))
    } finally {
      setDownloading(false)
    }
  }

  const handleDownload = async () => {
    if (!selected) return
    setDownloading(true)
    try {
      const filename = `Payslip_${selected.employee_id}_${payslip.month}_${payslip.year}.pdf`
      await downloadPayslipPdf(filename)
      toast.success('Payslip downloaded')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to download payslip'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col print:h-auto print:max-w-none">
      <header className="mb-6 shrink-0 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Payslip Generator
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Generate and print employee payslips
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row print:block print:h-auto">
        <div className="w-full shrink-0 space-y-6 overflow-y-auto rounded-xl border border-border bg-background p-6 lg:w-[420px] print:hidden">
          <div>
            <p
              className="mb-3 border-b border-border pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted"
              style={{ letterSpacing: '1px' }}
            >
              SELECT TEMPLATE
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => {
                const isSelected = payslip.selectedTemplate === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      updatePayslip('selectedTemplate', t.id)
                      if (t.id !== 1) setShowTaxPage(false)
                    }}
                    className="rounded-lg border text-left transition-colors"
                    style={{
                      border: isSelected ? '2px solid #EB3514' : '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#fff5f3' : '#fff',
                    }}
                  >
                    <div className="text-[10px] font-bold text-accent">{t.tag}</div>
                    <div className="mt-1 text-[11px] text-text-primary">{t.name}</div>
                    <div className="text-[10px] text-text-muted">{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionHeader title="Document Font" />
            <Select value={documentFont} onValueChange={setDocumentFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.css }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <SectionHeader title="Employee" />
            <EmployeeSearch
              employees={employees}
              selected={selected}
              onSelect={(emp) => {
                setSelected(emp)
                if (!emp) return
                const gross = Number(emp.gross_salary)
                setPayslip((prev) => ({
                  ...prev,
                  medical_allowance: getDefaultMedicalAllowance(gross),
                  pf_amount: getDefaultPfAmount(gross),
                }))
                setGenerated(false)
              }}
            />
          </div>

          <div>
            <SectionHeader title="Pay Period" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={payslip.month}
                  onValueChange={(v) => setMonthYear(v, payslip.year)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={payslip.year}
                  onChange={(e) => setMonthYear(payslip.month, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Period From</Label>
                <Input
                  type="date"
                  value={payslip.from_date}
                  onChange={(e) => updatePayslip('from_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Period To</Label>
                <Input
                  type="date"
                  value={payslip.to_date}
                  onChange={(e) => updatePayslip('to_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Date</Label>
                <Input
                  type="date"
                  value={payslip.pay_date}
                  onChange={(e) => updatePayslip('pay_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>LOP Days</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={payslip.lop_days}
                  onChange={(e) =>
                    updatePayslip('lop_days', parseFloat(e.target.value) || 0)
                  }
                />
                {leaveSummary && (
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Approved: {leaveSummary.approvedLeaveDays}d · This month:{' '}
                    {leaveSummary.monthlyAllowanceDays}d · Carry forward:{' '}
                    {leaveSummary.carryForwardDays}d · Total paid allowance:{' '}
                    {leaveSummary.paidAllowanceDays}d · Remaining:{' '}
                    {leaveSummary.paidLeaveRemaining}d
                    {leaveSummary.excessLeaveDays > 0 &&
                      ` · Excess: ${leaveSummary.excessLeaveDays}d (auto-filled)`}
                  </p>
                )}
                {workingDaysInPeriod != null && (
                  <p className="text-[11px] text-text-muted">
                    Total working days in period: {workingDaysInPeriod} (Sun off; 2nd &amp; 4th Sat
                    off)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Final Settlement</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={payslip.final_settlement || ''}
                  onChange={(e) =>
                    updatePayslip('final_settlement', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Salary Components (Editable)" />
            <p className="mb-3 text-[11px] text-text-muted">
              Override medical allowance or PF amount for this payslip. Values pre-fill from gross
              salary; edit as needed (e.g. PF ₹1,200).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medical Allowance (monthly)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={payslip.medical_allowance ?? ''}
                  onChange={(e) =>
                    updatePayslip(
                      'medical_allowance',
                      e.target.value === '' ? null : parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>PF Amount (monthly)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={payslip.pf_amount ?? ''}
                  onChange={(e) =>
                    updatePayslip(
                      'pf_amount',
                      e.target.value === '' ? null : parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Reimbursements" />
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={addReimbursement}>
                Add Reimbursement
              </Button>
            </div>
            <div className="space-y-2">
              {payslip.reimbursements.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    className="flex-1"
                    value={r.label}
                    onChange={(e) => updateReimbursement(i, 'label', e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Amount"
                    className="w-28"
                    value={r.amount || ''}
                    onChange={(e) =>
                      updateReimbursement(i, 'amount', parseFloat(e.target.value) || 0)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconLg"
                    className="shrink-0 text-text-secondary hover:bg-accent-light hover:text-accent"
                    onClick={() => removeReimbursement(i)}
                    aria-label="Remove reimbursement"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Other Deductions" />
            <p className="mb-3 text-[11px] text-text-muted">
              Professional Tax (₹200) is applied automatically.
            </p>
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={addDeduction}>
                Add Deduction
              </Button>
            </div>
            <div className="space-y-2">
              {payslip.custom_deductions.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    className="flex-1"
                    value={d.label}
                    onChange={(e) => updateDeduction(i, 'label', e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Amount"
                    className="w-28"
                    value={d.amount || ''}
                    onChange={(e) =>
                      updateDeduction(i, 'amount', parseFloat(e.target.value) || 0)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconLg"
                    className="shrink-0 text-text-secondary hover:bg-accent-light hover:text-accent"
                    onClick={() => removeDeduction(i)}
                    aria-label="Remove deduction"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {payslip.selectedTemplate === 1 ? (
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showTaxPage}
                  className="accent-accent"
                  onChange={(e) => {
                    setShowTaxPage(e.target.checked)
                    setGenerated(false)
                  }}
                />
                <span style={{ fontSize: 13, color: '#111827' }}>
                  Include Tax Summary Page (Page 2)
                </span>
              </label>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Tax values on page 2 are placeholder zeros — for reference only
              </p>
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <Button className="w-full" onClick={handleGenerate} disabled={downloading}>
              {downloading ? 'Downloading…' : 'Generate Payslip'}
            </Button>
            {generated && (
              <div className="flex gap-2">
                <PrintButton className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  Download PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto print:w-full print:overflow-visible">
          <DocumentPreviewFrame
            pages={
              payslip.selectedTemplate === 1 && showTaxPage
                ? 2
                : payslip.selectedTemplate === 4
                  ? 2
                  : 1
            }
          >
            {payslip.selectedTemplate === 1 ? <PayslipPreview {...previewProps} /> : null}
            {payslip.selectedTemplate === 2 ? <PayslipPreviewT2 {...previewProps} /> : null}
            {payslip.selectedTemplate === 3 ? <PayslipPreviewT3 {...previewProps} /> : null}
            {payslip.selectedTemplate === 4 ? <PayslipPreviewT4 {...previewProps} /> : null}
          </DocumentPreviewFrame>
        </div>
      </div>
    </div>
  )
}
