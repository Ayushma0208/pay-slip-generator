'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const COLUMN_MAP: Record<string, string> = {
  name: 'name',
  employee_id: 'employee_id',
  employeeid: 'employee_id',
  'employee id': 'employee_id',
  designation: 'designation',
  department: 'department',
  joining_date: 'joining_date',
  joiningdate: 'joining_date',
  'joining date': 'joining_date',
  email: 'email',
  phone: 'phone',
  bank_name: 'bank_name',
  bankname: 'bank_name',
  'bank name': 'bank_name',
  bank_account: 'bank_account',
  bankaccount: 'bank_account',
  'bank account': 'bank_account',
  pan_number: 'pan_number',
  pannumber: 'pan_number',
  'pan number': 'pan_number',
  pf_number: 'pf_number',
  pfnumber: 'pf_number',
  'pf number': 'pf_number',
  uan: 'uan',
  gross_salary: 'gross_salary',
  grosssalary: 'gross_salary',
  'gross salary': 'gross_salary',
  payment_mode: 'payment_mode',
  paymentmode: 'payment_mode',
  'payment mode': 'payment_mode',
}

function normalizeHeader(h: string): string {
  return COLUMN_MAP[h.toLowerCase().trim().replace(/\s+/g, ' ')] || ''
}

function parseDate(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const m = String(parsed.m).padStart(2, '0')
      const d = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${m}-${d}`
    }
  }
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split('T')[0]
  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }
  return str || null
}

interface ExcelUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ExcelUpload({ open, onOpenChange, onSuccess }: ExcelUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewCount, setPreviewCount] = useState(0)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [defaultPassword, setDefaultPassword] = useState('Employee@123')
  const [uploading, setUploading] = useState(false)

  const reset = () => {
    setPreviewCount(0)
    setRows([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      const parsed: Record<string, unknown>[] = []
      for (const row of raw) {
        const mapped: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(row)) {
          const field = normalizeHeader(String(key))
          if (field) mapped[field] = val
        }
        if (mapped.name && mapped.employee_id) {
          mapped.joining_date = parseDate(mapped.joining_date)
          mapped.gross_salary = parseFloat(String(mapped.gross_salary)) || 0
          mapped.payment_mode = mapped.payment_mode
            ? String(mapped.payment_mode)
            : 'Bank Transfer'
          parsed.push(mapped)
        }
      }

      setRows(parsed)
      setPreviewCount(parsed.length)
      if (parsed.length === 0) {
        toast.error('No valid rows found. Ensure name and employee_id columns exist.')
      }
    } catch {
      toast.error('Failed to parse Excel file')
      reset()
    }
  }

  const handleUpload = async () => {
    if (rows.length === 0) {
      toast.error('No rows to upload')
      return
    }

    setUploading(true)
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: rows, defaultPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      toast.success(
        `Imported ${data.imported} employee(s)${data.errors?.length ? ` (${data.errors.length} skipped)` : ''}`
      )
      if (data.errors?.length) {
        console.warn('Import warnings:', data.errors)
      }
      onOpenChange(false)
      reset()
      onSuccess()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Excel</DialogTitle>
          <DialogDescription>
            Upload .xlsx or .xls with columns: name, employee_id, designation, department,
            joining_date, email, phone, bank_name, bank_account, pan_number, pf_number, uan,
            gross_salary, payment_mode
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="block w-full text-sm"
          onChange={handleFile}
        />
        {previewCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {previewCount} employee(s) ready to import
          </p>
        )}
        <div className="space-y-2">
          <Label>Default login password for imported employees</Label>
          <Input
            type="password"
            value={defaultPassword}
            onChange={(e) => setDefaultPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
          <p className="text-xs text-text-muted">Each row must include an email for login.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || previewCount === 0}>
            {uploading ? 'Uploading...' : 'Import Employees'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
