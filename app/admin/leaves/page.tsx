'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import type { Employee } from '@/types'
import AddHistoricalLeaveForm from '@/components/admin/AddHistoricalLeaveForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  employee: { name: string; employee_id: string }
}

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, empRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/employees'),
      ])
      if (!leavesRes.ok) throw new Error('Failed to load leaves')
      setLeaves(await leavesRes.json())
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load leaves'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActing(id)
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_note: notes[id] || '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update leave')
      toast.success(`Leave ${status.toLowerCase()}`)
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update leave'))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Leave Requests</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Approve requests or backfill historical leave from before the app was used
        </p>
      </header>

      <AddHistoricalLeaveForm employees={employees} onSuccess={load} />

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted">
                  No leave requests yet
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div>{l.employee.name}</div>
                    <div className="text-xs text-text-muted">{l.employee.employee_id}</div>
                  </TableCell>
                  <TableCell>{l.leave_type}</TableCell>
                  <TableCell>{l.from_date}</TableCell>
                  <TableCell>{l.to_date}</TableCell>
                  <TableCell>{l.days}</TableCell>
                  <TableCell>{l.status}</TableCell>
                  <TableCell>
                    {l.status === 'PENDING' ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input
                          placeholder="Admin note (optional)"
                          value={notes[l.id] || ''}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [l.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={acting === l.id}
                            onClick={() => review(l.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={acting === l.id}
                            onClick={() => review(l.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">{l.admin_note || '—'}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
