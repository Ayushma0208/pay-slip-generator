'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import PeopleIcon from '@mui/icons-material/People'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import PaymentsIcon from '@mui/icons-material/Payments'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import MuiProvider from '@/components/MuiProvider'

type Analytics = {
  kpis: {
    totalEmployees: number
    pendingLeaves: number
    approvedLeaves: number
    rejectedLeaves: number
    todayAttendance: number
    absentToday: number
    monthlyPayroll: number
    attendanceRate: number
  }
  attendanceTrend: { date: string; label: string; count: number }[]
  leaveByStatus: { status: string; count: number }[]
  leaveByType: { type: string; count: number }[]
  departmentBreakdown: { department: string; count: number }[]
  recentLeaves: {
    id: string
    employee: string
    employee_id: string
    leave_type: string
    days: number
    status: string
    created_at: string
  }[]
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function statusColor(status: string) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  return 'warning'
}

function DashboardContent() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Failed to load analytics')
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
        {error || 'No data'}
      </Alert>
    )
  }

  const { kpis } = data
  const payrollFmt = kpis.monthlyPayroll.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HR overview — attendance, leaves, payroll & workforce
          </Typography>
        </Box>
        <Button variant="outlined" onClick={load}>
          Refresh
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <KpiCard
          title="Total Employees"
          value={kpis.totalEmployees}
          icon={<PeopleIcon />}
          color="#2563eb"
        />
        <KpiCard
          title="Present Today"
          value={kpis.todayAttendance}
          subtitle={`${kpis.attendanceRate}% attendance`}
          icon={<HowToRegIcon />}
          color="#16a34a"
        />
        <KpiCard
          title="Pending Leaves"
          value={kpis.pendingLeaves}
          subtitle={`${kpis.approvedLeaves} approved · ${kpis.rejectedLeaves} rejected`}
          icon={<EventBusyIcon />}
          color="#f59e0b"
        />
        <KpiCard
          title="Monthly Payroll"
          value={payrollFmt}
          subtitle="Total gross salary"
          icon={<PaymentsIcon />}
          color="#EB3514"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attendance Trend (Last 7 Days)
            </Typography>
            <LineChart
              height={280}
              series={[
                {
                  data: data.attendanceTrend.map((d) => d.count),
                  label: 'Check-ins',
                  color: '#EB3514',
                  curve: 'monotoneX',
                },
              ]}
              xAxis={[
                {
                  scaleType: 'point',
                  data: data.attendanceTrend.map((d) => d.label),
                },
              ]}
              margin={{ left: 40, right: 20, top: 20, bottom: 40 }}
            />
          </CardContent>
        </Card>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leave Status
            </Typography>
            <PieChart
              height={260}
              series={[
                {
                  data: data.leaveByStatus.map((s, i) => ({
                    id: i,
                    value: s.count,
                    label: s.status,
                  })),
                  innerRadius: 50,
                  paddingAngle: 2,
                },
              ]}
              colors={['#f59e0b', '#16a34a', '#dc2626']}
            />
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leave by Type (30 days)
            </Typography>
            {data.leaveByType.length > 0 ? (
              <BarChart
                height={280}
                series={[{ data: data.leaveByType.map((t) => t.count), label: 'Requests' }]}
                xAxis={[{ scaleType: 'band', data: data.leaveByType.map((t) => t.type) }]}
                colors={['#2563eb']}
                margin={{ left: 40, right: 20, top: 20, bottom: 60 }}
              />
            ) : (
              <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                No leave requests in the last 30 days
              </Typography>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Employees by Department
            </Typography>
            {data.departmentBreakdown.length > 0 ? (
              <BarChart
                layout="horizontal"
                height={280}
                series={[
                  { data: data.departmentBreakdown.map((d) => d.count), label: 'Employees' },
                ]}
                yAxis={[
                  {
                    scaleType: 'band',
                    data: data.departmentBreakdown.map((d) => d.department),
                  },
                ]}
                colors={['#EB3514']}
                margin={{ left: 100, right: 20, top: 20, bottom: 30 }}
              />
            ) : (
              <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                No department data yet
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Leave Requests</Typography>
            <Button component={Link} href="/admin/leaves" size="small">
              View all
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No leave requests yet
                  </TableCell>
                </TableRow>
              ) : (
                data.recentLeaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {l.employee}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.employee_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{l.leave_type}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell>
                      <Chip label={l.status} size="small" color={statusColor(l.status)} />
                    </TableCell>
                    <TableCell>
                      {new Date(l.created_at).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

export default function AnalyticsDashboard() {
  return (
    <MuiProvider>
      <DashboardContent />
    </MuiProvider>
  )
}
