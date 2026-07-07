'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import { calculateSalary } from '@/lib/salaryCalc'
import { getErrorMessage, MONTHS, getMonthDateRange } from '@/lib/utils'
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
  overtime_hours: 0,
  final_settlement: 0,
  custom_deductions: [],
  reimbursements: [],
  showTaxPage: false,
  selectedTemplate: 4,
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
            overtimeHours: payslip.overtime_hours,
          }
        )
      : null

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
  }

  const handleGenerate = () => {
    if (!selected) {
      toast.error('Please select an employee')
      return
    }
    if (!payslip.from_date || !payslip.to_date) {
      toast.error('Please set pay period dates')
      return
    }
    setGenerated(true)
    toast.success('Payslip generated')
  }

  return (
    <div className="print:max-w-none">
      <header className="mb-6 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Payslip Generator
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Generate and print employee payslips
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row print:block">
        <div className="w-full shrink-0 space-y-6 rounded-xl border border-border bg-background p-6 lg:w-[420px] lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto print:hidden">
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
            <SectionHeader title="Employee" />
            <EmployeeSearch
              employees={employees}
              selected={selected}
              onSelect={(emp) => {
                setSelected(emp)
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
                  value={payslip.lop_days}
                  onChange={(e) =>
                    updatePayslip('lop_days', parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Overtime Hours</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={payslip.overtime_hours}
                  onChange={(e) =>
                    updatePayslip('overtime_hours', parseFloat(e.target.value) || 0)
                  }
                />
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
            <Button className="w-full" onClick={handleGenerate}>
              Generate Payslip
            </Button>
            {generated && <PrintButton />}
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:sticky lg:top-8 lg:self-start print:w-full">
          <DocumentPreviewFrame
            pages={payslip.selectedTemplate === 1 && showTaxPage ? 2 : 1}
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
