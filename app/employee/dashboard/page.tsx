'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/utils'

type AttendanceRecord = {
  id: string
  date: string
  check_in: string
  check_out: string | null
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession()
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const loadToday = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?from=${today}&to=${today}`)
      if (!res.ok) throw new Error('Failed to load attendance')
      const data = await res.json()
      setTodayRecord(data[0] ?? null)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load attendance'))
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    loadToday()
  }, [loadToday])

  const handleAction = async (action: 'check-in' | 'check-out') => {
    setActing(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setTodayRecord(data)
      toast.success(action === 'check-in' ? 'Checked in' : 'Checked out')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setActing(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome, {session?.user?.name || session?.user?.email}
        </p>
      </header>

      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-base font-semibold">Today&apos;s Attendance</h2>
        <p className="mt-1 text-sm text-text-muted">{today}</p>

        {loading ? (
          <p className="mt-4 text-sm text-text-muted">Loading...</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}
