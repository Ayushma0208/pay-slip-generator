'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { formatCurrency, getErrorMessage } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PaySummary = {
  monthName: string
  year: number
  grossSalary: number
  estimatedNetPay: number
  approvedLeaveDays: number
  monthlyAllowanceDays: number
  carryForwardDays: number
  paidAllowanceDays: number
  paidFullDays: number
  paidHalfDays: number
  excessLeaveDays: number
  paidLeaveRemaining: number
  leaveDeduction: number
  perDayRate: number
}

type LeaveRow = {
  id: string
  leave_type: string
  from_date: string
  to_date: string
  days: number
  status: string
}

type DashboardData = {
  pay_summary: PaySummary
  today_attendance: {
    check_in: string
    check_out: string | null
  } | null
  pending_leave_count: number
  recent_leaves: LeaveRow[]
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employee/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      setData(await res.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (action: 'check-in' | 'check-out') => {
    setActing(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Action failed')
      toast.success(action === 'check-in' ? 'Checked in' : 'Checked out')
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setActing(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const pay = data?.pay_summary
  const todayRecord = data?.today_attendance

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome, {session?.user?.name || session?.user?.email}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm text-text-secondary">Paid Leave Remaining</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {pay?.paidLeaveRemaining ?? 0} day{(pay?.paidLeaveRemaining ?? 0) !== 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {pay?.monthlyAllowanceDays ?? 0} this month
                {(pay?.carryForwardDays ?? 0) > 0 && <> + {pay?.carryForwardDays}d carry</>}
                {' − '}
                {pay?.approvedLeaveDays ?? 0} used
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm text-text-secondary">Monthly Gross Pay</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {formatCurrency(pay?.grossSalary ?? 0)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {pay?.monthName} {pay?.year}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm text-text-secondary">Estimated Net Pay</p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {formatCurrency(pay?.estimatedNetPay ?? 0)}
              </p>
              <p className="mt-1 text-xs text-text-muted">After leave deductions</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm text-text-secondary">Leave Taken (This Month)</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {pay?.approvedLeaveDays ?? 0} day{(pay?.approvedLeaveDays ?? 0) !== 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Paid allowance: {pay?.paidAllowanceDays ?? 0}d
                {(pay?.carryForwardDays ?? 0) > 0 && (
                  <> (incl. {pay?.carryForwardDays}d carry forward)</>
                )}
              </p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                (pay?.leaveDeduction ?? 0) > 0
                  ? 'border-red-200 bg-red-50'
                  : 'border-border bg-background'
              }`}
            >
              <p className="text-sm text-text-secondary">Leave Deduction</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  (pay?.leaveDeduction ?? 0) > 0 ? 'text-red-700' : 'text-text-primary'
                }`}
              >
                {formatCurrency(pay?.leaveDeduction ?? 0)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {(pay?.excessLeaveDays ?? 0) > 0
                  ? `${pay?.excessLeaveDays} excess day(s) × ${formatCurrency(pay?.perDayRate ?? 0)}/day`
                  : 'Within paid leave limit'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="text-base font-semibold">Today&apos;s Attendance</h2>
              <p className="mt-1 text-sm text-text-muted">{today}</p>
              <div className="mt-4 space-y-3">
                <p className="text-sm">
                  Check-in:{' '}
                  <span className="font-medium">
                    {todayRecord?.check_in ? formatTime(todayRecord.check_in) : '—'}
                  </span>
                </p>
                <p className="text-sm">
                  Check-out:{' '}
                  <span className="font-medium">
                    {todayRecord?.check_out ? formatTime(todayRecord.check_out) : '—'}
                  </span>
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleAction('check-in')}
                    disabled={acting || !!todayRecord}
                  >
                    Check In
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('check-out')}
                    disabled={acting || !todayRecord || !!todayRecord.check_out}
                  >
                    Check Out
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Leave Policy</h2>
                <Link
                  href="/employee/leaves"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Request leave →
                </Link>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="text-text-secondary">Paid leave per month:</span>{' '}
                  <span className="font-medium">1 full day + 1 half day</span>
                </p>
                {(pay?.carryForwardDays ?? 0) > 0 && (
                  <p>
                    <span className="text-text-secondary">Carry forward from last month:</span>{' '}
                    <span className="font-medium text-green-700">
                      +{pay?.carryForwardDays} day(s)
                    </span>
                  </p>
                )}
                <p>
                  <span className="text-text-secondary">Total paid allowance this month:</span>{' '}
                  <span className="font-medium">{pay?.paidAllowanceDays ?? 0} days</span>
                </p>
                <p>
                  <span className="text-text-secondary">Used this month:</span>{' '}
                  <span className="font-medium">{pay?.approvedLeaveDays ?? 0} days (approved)</span>
                </p>
                <p>
                  <span className="text-text-secondary">Paid leave remaining:</span>{' '}
                  <span className="font-medium text-green-700">
                    {pay?.paidLeaveRemaining ?? 0} day(s)
                  </span>
                </p>
                <p>
                  <span className="text-text-secondary">Pending requests:</span>{' '}
                  <span className="font-medium">{data?.pending_leave_count ?? 0}</span>
                </p>
                {(pay?.excessLeaveDays ?? 0) > 0 && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
                    You have exceeded the paid leave limit by{' '}
                    <strong>{pay?.excessLeaveDays} day(s)</strong>. A deduction of{' '}
                    <strong>{formatCurrency(pay?.leaveDeduction ?? 0)}</strong> applies this month.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold">Recent Leave Requests</h2>
              <Link
                href="/employee/leaves"
                className="text-sm font-medium text-accent hover:underline"
              >
                View all
              </Link>
            </div>
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
                {(data?.recent_leaves ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-text-muted">
                      No leave requests yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.recent_leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.leave_type}</TableCell>
                      <TableCell>{l.from_date}</TableCell>
                      <TableCell>{l.to_date}</TableCell>
                      <TableCell>{l.days}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusColor[l.status] ?? 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
