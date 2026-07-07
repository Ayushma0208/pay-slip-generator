'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PAYMENT_MODES, getErrorMessage } from '@/lib/utils'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const emptyForm = {
  name: '',
  employee_id: '',
  designation: '',
  department: '',
  joining_date: '',
  email: '',
  phone: '',
  bank_name: '',
  bank_account: '',
  pan_number: '',
  pf_number: '',
  uan: '',
  gross_salary: '',
  payment_mode: 'Bank Transfer',
  password: '',
}

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  onSuccess: () => void
}

export default function EmployeeForm({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        employee_id: employee.employee_id || '',
        designation: employee.designation || '',
        department: employee.department || '',
        joining_date: employee.joining_date ? employee.joining_date.split('T')[0] : '',
        email: employee.email || '',
        phone: employee.phone || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        pan_number: employee.pan_number || '',
        pf_number: employee.pf_number || '',
        uan: employee.uan || '',
        gross_salary: String(employee.gross_salary ?? ''),
        payment_mode: employee.payment_mode || 'Bank Transfer',
        password: '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [employee, open])

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.employee_id.trim()) {
      toast.error('Name and Employee ID are required')
      return
    }
    if (!form.email.trim()) {
      toast.error('Email is required for employee login')
      return
    }
    if (!employee && (!form.password || form.password.length < 6)) {
      toast.error('Initial password must be at least 6 characters')
      return
    }
    const gross = parseFloat(form.gross_salary)
    if (Number.isNaN(gross) || gross < 0) {
      toast.error('Valid gross salary is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        employee_id: form.employee_id.trim(),
        designation: form.designation || null,
        department: form.department || null,
        joining_date: form.joining_date || null,
        email: form.email.trim(),
        phone: form.phone || null,
        bank_name: form.bank_name || null,
        bank_account: form.bank_account || null,
        pan_number: form.pan_number || null,
        pf_number: form.pf_number || null,
        uan: form.uan || null,
        gross_salary: gross,
        payment_mode: form.payment_mode,
        ...(form.password ? { password: form.password } : {}),
      }

      const url = employee ? `/api/employees/${employee.id}` : '/api/employees'
      const res = await fetch(url, {
        method: employee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save employee')

      toast.success(employee ? 'Employee updated successfully' : 'Employee added successfully')
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save employee'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Employee Name *</Label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Employee ID *</Label>
            <Input
              value={form.employee_id}
              onChange={(e) => update('employee_id', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) => update('designation', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Joining</Label>
            <Input
              type="date"
              value={form.joining_date}
              onChange={(e) => update('joining_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Login Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input
              value={form.bank_name}
              onChange={(e) => update('bank_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Bank Account Number</Label>
            <Input
              value={form.bank_account}
              onChange={(e) => update('bank_account', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>PAN Number</Label>
            <Input
              value={form.pan_number}
              onChange={(e) => update('pan_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>PF Number</Label>
            <Input value={form.pf_number} onChange={(e) => update('pf_number', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>UAN</Label>
            <Input value={form.uan} onChange={(e) => update('uan', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gross Salary *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.gross_salary}
              onChange={(e) => update('gross_salary', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={form.payment_mode} onValueChange={(v) => update('payment_mode', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{employee ? 'Reset Password (optional)' : 'Initial Password *'}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={employee ? 'Leave blank to keep current password' : 'Min 6 characters'}
              required={!employee}
              minLength={employee ? undefined : 6}
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : employee ? 'Update' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
