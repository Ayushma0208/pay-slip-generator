'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, getErrorMessage, getInitials } from '@/lib/utils'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import AddHistoricalLeaveForm from '@/components/admin/AddHistoricalLeaveForm'

type PaySummary = {
  monthName: string
  year: number
  grossSalary: number
  estimatedNetPay: number
  approvedLeaveDays: number
  monthlyAllowanceDays: number
  carryForwardDays: number
  paidAllowanceDays: number
  paidLeaveRemaining: number
  excessLeaveDays: number
  leaveDeduction: number
}

type AttendanceRow = {
  id: string
  date: string
  check_in: string
  check_out: string | null
}

type LeaveRow = {
  id: string
  leave_type: string
  from_date: string
  to_date: string
  days: number
  status: string
  reason: string | null
}

type EmployeeDetail = {
  employee: Employee
  attendance: AttendanceRow[]
  leaves: LeaveRow[]
  pay_summary: PaySummary
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/employees/${id}`)
      if (!res.ok) throw new Error('Failed to load employee')
      setData(await res.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load employee'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const formatTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Employee not found</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/employees">Back to employees</Link>
        </Button>
      </div>
    )
  }

  const { employee, attendance, leaves, pay_summary: pay } = data

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/employees"
            className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-lg font-semibold text-accent"
              aria-hidden
            >
              {getInitials(employee.name)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{employee.name}</h1>
              <p className="text-sm text-text-secondary">
                {employee.employee_id} · {employee.designation || 'No designation'}
                {employee.department ? ` · ${employee.department}` : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-text-secondary">Paid Leave Remaining</p>
          <p className="mt-1 text-xl font-bold text-green-800">
            {pay.paidLeaveRemaining} day{pay.paidLeaveRemaining !== 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {pay.paidAllowanceDays} available − {pay.approvedLeaveDays} used
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-text-secondary">Gross Salary</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(employee.gross_salary)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-text-secondary">Leave Taken ({pay.monthName})</p>
          <p className="mt-1 text-xl font-bold">{pay.approvedLeaveDays} days</p>
          {pay.carryForwardDays > 0 && (
            <p className="mt-1 text-xs text-green-700">+{pay.carryForwardDays}d carry forward</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-text-secondary">Leave Deduction</p>
          <p className={`mt-1 text-xl font-bold ${pay.leaveDeduction > 0 ? 'text-red-700' : ''}`}>
            {formatCurrency(pay.leaveDeduction)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-text-secondary">Est. Net Pay</p>
          <p className="mt-1 text-xl font-bold text-green-700">
            {formatCurrency(pay.estimatedNetPay)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <User className="h-5 w-5" />
          Employee Details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {[
            ['Email', employee.email || '—'],
            ['Phone', employee.phone || '—'],
            ['Joining Date', employee.joining_date || '—'],
            ['Bank', employee.bank_name || '—'],
            ['Account', employee.bank_account || '—'],
            ['PAN', employee.pan_number || '—'],
            ['PF Number', employee.pf_number || '—'],
            ['UAN', employee.uan || '—'],
            ['Payment Mode', employee.payment_mode || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-text-secondary">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Attendance — Check-in & Check-out</h2>
          <p className="mt-1 text-sm text-text-secondary">All recorded attendance for this employee</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-text-muted">
                  No attendance records yet
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{formatTime(r.check_in)}</TableCell>
                  <TableCell>{formatTime(r.check_out)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Leave History</h2>
        </div>
        <div className="p-6 border-b border-border">
          <AddHistoricalLeaveForm
            employeeId={employee.id}
            employeeName={employee.name}
            onSuccess={load}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  No leave requests
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.leave_type}</TableCell>
                  <TableCell>{l.from_date}</TableCell>
                  <TableCell>{l.to_date}</TableCell>
                  <TableCell>{l.days}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColor[l.status] ?? 'bg-gray-100'
                      }`}
                    >
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{l.reason || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
