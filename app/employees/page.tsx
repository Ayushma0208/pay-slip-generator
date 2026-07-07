'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Upload, Users, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, getErrorMessage, getInitials } from '@/lib/utils'
import type { Employee } from '@/types'
import type { MonthlyLeaveSummary } from '@/lib/leavePolicy'

type EmployeeWithSummary = Employee & { pay_summary?: MonthlyLeaveSummary }
import EmployeeForm from '@/components/EmployeeForm'
import ExcelUpload from '@/components/ExcelUpload'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function mapEmployee(row: Record<string, unknown>): EmployeeWithSummary {
  return row as unknown as EmployeeWithSummary
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [excelOpen, setExcelOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to load employees')
      const data = await res.json()
      setEmployees(data.map(mapEmployee))
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load employees'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/employees/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Employee deleted')
      setDeleteTarget(null)
      fetchEmployees()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Employees</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your team members</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => setExcelOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Excel
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-6 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-text-muted" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-text-primary">No employees yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add your first employee to get started
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-surface">
                <TableHead>Name</TableHead>
                <TableHead>Emp ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Paid Leave Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent"
                        aria-hidden
                      >
                        {getInitials(emp.name)}
                      </div>
                      <span className="font-medium text-text-primary">{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">{emp.employee_id}</TableCell>
                  <TableCell>{emp.designation || '—'}</TableCell>
                  <TableCell>
                    {emp.department ? (
                      <span className="inline-flex rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                        {emp.department}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-text-primary">
                    {formatCurrency(Number(emp.gross_salary))}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-700">
                      {emp.pay_summary?.paidLeaveRemaining ?? 0}d
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="iconLg"
                      className="text-text-secondary hover:bg-accent-light hover:text-accent"
                      asChild
                    >
                      <Link href={`/employees/${emp.id}`} aria-label="View employee">
                        <Eye className="h-5 w-5" strokeWidth={2.5} />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconLg"
                      className="text-text-secondary hover:bg-accent-light hover:text-accent"
                      onClick={() => {
                        setEditing(emp)
                        setFormOpen(true)
                      }}
                      aria-label="Edit employee"
                    >
                      <Pencil className="h-5 w-5" strokeWidth={2.5} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconLg"
                      className="text-text-secondary hover:bg-accent-light hover:text-accent"
                      onClick={() => setDeleteTarget(emp)}
                      aria-label="Delete employee"
                    >
                      <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSuccess={fetchEmployees}
      />
      <ExcelUpload open={excelOpen} onOpenChange={setExcelOpen} onSuccess={fetchEmployees} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
