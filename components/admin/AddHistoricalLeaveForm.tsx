'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { calculateLeaveDays, getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Employee } from '@/types'

const LEAVE_TYPES = ['Sick Leave', 'Earned Leave', 'Casual Leave', 'Optional Holiday', 'Unpaid Leave']

type Props = {
  employees?: Employee[]
  employeeId?: string
  employeeName?: string
  onSuccess: () => void
}

export default function AddHistoricalLeaveForm({
  employees,
  employeeId: fixedEmployeeId,
  employeeName,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    employee_id: fixedEmployeeId ?? '',
    leave_type: LEAVE_TYPES[0],
    from_date: '',
    to_date: '',
    reason: '',
    admin_note: '',
    half_day: false,
  })

  const isSingleDay = form.from_date && form.to_date && form.from_date === form.to_date
  const leaveDays =
    form.from_date && form.to_date
      ? form.half_day && isSingleDay
        ? 0.5
        : calculateLeaveDays(form.from_date, form.to_date)
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const empId = fixedEmployeeId || form.employee_id
    if (!empId) {
      toast.error('Please select an employee')
      return
    }
    if (!form.from_date || !form.to_date) {
      toast.error('Please select dates')
      return
    }
    if (leaveDays <= 0) {
      toast.error('To date must be on or after from date')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          leave_type: form.leave_type,
          from_date: form.from_date,
          to_date: form.to_date,
          reason: form.reason || 'Historical leave',
          admin_note: form.admin_note || 'Backfilled by admin',
          half_day: form.half_day && isSingleDay,
          status: 'APPROVED',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add leave')
      toast.success('Historical leave added')
      setForm((f) => ({
        ...f,
        from_date: '',
        to_date: '',
        reason: '',
        admin_note: '',
        half_day: false,
      }))
      onSuccess()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add leave'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-text-primary">Add Historical Leave</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Backfill past leave (e.g. April, May, June) so carry forward and deductions calculate
          correctly.
          {employeeName ? ` Adding for ${employeeName}.` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!fixedEmployeeId && employees && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Employee</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              required
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Leave Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={form.leave_type}
            onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Days</Label>
          <Input type="text" value={leaveDays || '—'} readOnly className="bg-surface" />
        </div>
        <div className="space-y-2">
          <Label>From Date</Label>
          <Input
            type="date"
            value={form.from_date}
            onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>To Date</Label>
          <Input
            type="date"
            value={form.to_date}
            onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))}
            min={form.from_date || undefined}
            required
          />
        </div>
        {isSingleDay && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              id="hist_half_day"
              checked={form.half_day}
              onChange={(e) => setForm((f) => ({ ...f, half_day: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="hist_half_day" className="cursor-pointer font-normal">
              Half day (0.5 day)
            </Label>
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label>Reason</Label>
          <Textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="e.g. Leave taken in May 2026"
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Add as Approved Leave'}
      </Button>
    </form>
  )
}
