'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage, calculateLeaveDays } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type LeaveRequest = {
  id: string
  leave_type: string
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: string
  admin_note: string | null
}

const LEAVE_TYPES = ['Sick Leave', 'Earned Leave', 'Casual Leave', 'Optional Holiday', 'Unpaid Leave']

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0],
    from_date: '',
    to_date: '',
    reason: '',
    half_day: false,
  })

  const isSingleDay = form.from_date && form.to_date && form.from_date === form.to_date
  const leaveDays = form.from_date && form.to_date
    ? form.half_day && isSingleDay
      ? 0.5
      : calculateLeaveDays(form.from_date, form.to_date)
    : 0

  const updateDates = (field: 'from_date' | 'to_date', value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leaves')
      if (!res.ok) throw new Error('Failed to load leaves')
      setLeaves(await res.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load leaves'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.from_date || !form.to_date) {
      toast.error('Please select date range')
      return
    }
    if (leaveDays <= 0) {
      toast.error('To date must be on or after from date')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, half_day: form.half_day && isSingleDay }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave')
      toast.success('Leave request submitted')
      setForm({ leave_type: LEAVE_TYPES[0], from_date: '', to_date: '', reason: '', half_day: false })
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit leave'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">My Leaves</h1>
        <p className="mt-1 text-sm text-text-secondary">Submit and track leave requests</p>
      </header>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <strong>Paid leave policy:</strong> 1 full day + 1 half day per month are paid. Unused paid
        leave from the previous month carries forward. Extra leave days are deducted from monthly pay.
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-6 space-y-4">
        <h2 className="font-semibold">Request Leave</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label>Days (auto-calculated)</Label>
            <Input type="text" value={leaveDays || '—'} readOnly className="bg-surface" />
          </div>
          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={form.from_date}
              onChange={(e) => updateDates('from_date', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={form.to_date}
              onChange={(e) => updateDates('to_date', e.target.value)}
              min={form.from_date || undefined}
              required
            />
          </div>
          {isSingleDay && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="half_day"
                checked={form.half_day}
                onChange={(e) => setForm((f) => ({ ...f, half_day: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="half_day" className="cursor-pointer font-normal">
                Half day leave (0.5 day)
              </Label>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={3}
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-muted">
                  No leave requests yet
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.leave_type}</TableCell>
                  <TableCell>{l.from_date}</TableCell>
                  <TableCell>{l.to_date}</TableCell>
                  <TableCell>{l.days}</TableCell>
                  <TableCell>{l.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
