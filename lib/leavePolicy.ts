import { calculateLeaveDays } from '@/lib/utils'
import { countWorkingDaysInMonth } from '@/lib/workingDays'

/** Paid leave allowance per calendar month */
export const MONTHLY_PAID_FULL_DAYS = 1
export const MONTHLY_PAID_HALF_DAYS = 0.5
export const MONTHLY_PAID_LEAVE_ALLOWANCE = MONTHLY_PAID_FULL_DAYS + MONTHLY_PAID_HALF_DAYS

export type LeaveRecordInput = {
  fromDate: Date
  toDate: Date
  days: number
  status: string
}

export function daysOverlappingMonth(
  fromDate: Date,
  toDate: Date,
  year: number,
  month: number
): number {
  const monthStart = new Date(year, month, 1, 12, 0, 0, 0)
  const monthEnd = new Date(year, month + 1, 0, 12, 0, 0, 0)
  const start = new Date(fromDate)
  start.setHours(12, 0, 0, 0)
  const end = new Date(toDate)
  end.setHours(12, 0, 0, 0)

  const overlapStart = start > monthStart ? start : monthStart
  const overlapEnd = end < monthEnd ? end : monthEnd
  if (overlapStart > overlapEnd) return 0

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1
}

export function leaveDaysInMonth(
  leave: LeaveRecordInput,
  year: number,
  month: number
): number {
  if (leave.status !== 'APPROVED') return 0

  const fromStr = leave.fromDate.toISOString().split('T')[0]
  const toStr = leave.toDate.toISOString().split('T')[0]
  const totalCalendarDays = calculateLeaveDays(fromStr, toStr)
  const overlapDays = daysOverlappingMonth(leave.fromDate, leave.toDate, year, month)

  if (overlapDays === 0 || totalCalendarDays === 0) return 0
  if (overlapDays >= totalCalendarDays) return Number(leave.days)

  return parseFloat(((Number(leave.days) * overlapDays) / totalCalendarDays).toFixed(1))
}

export function getApprovedLeaveDaysInMonth(
  leaves: LeaveRecordInput[],
  year: number,
  month: number
): number {
  const total = leaves.reduce((sum, leave) => sum + leaveDaysInMonth(leave, year, month), 0)
  return parseFloat(total.toFixed(1))
}

/** Month start from which leave policy applies (joining date preferred over app-created date) */
export function getLeavePolicyStartDate(
  joiningDate?: Date | null,
  employeeCreatedAt?: Date | null
): Date | null {
  const start = joiningDate ?? employeeCreatedAt
  if (!start) return null
  const d = new Date(start)
  d.setHours(12, 0, 0, 0)
  return d
}

/** Unused paid allowance from prior months chains forward from policy start date */
export function getCarryForwardLeaveDays(
  leaves: LeaveRecordInput[],
  year: number,
  month: number,
  policyStartDate?: Date | null,
  depth = 24
): number {
  if (depth <= 0) return 0

  let prevMonth = month - 1
  let prevYear = year
  if (prevMonth < 0) {
    prevMonth = 11
    prevYear -= 1
  }

  if (policyStartDate) {
    const start = new Date(policyStartDate)
    start.setHours(12, 0, 0, 0)
    const prevMonthStart = new Date(prevYear, prevMonth, 1, 12, 0, 0, 0)
    const policyMonthStart = new Date(start.getFullYear(), start.getMonth(), 1, 12, 0, 0, 0)
    if (prevMonthStart < policyMonthStart) return 0
  }

  const prevUsed = getApprovedLeaveDaysInMonth(leaves, prevYear, prevMonth)
  const prevCarry = getCarryForwardLeaveDays(leaves, prevYear, prevMonth, policyStartDate, depth - 1)
  const prevTotalAllowance = MONTHLY_PAID_LEAVE_ALLOWANCE + prevCarry
  const prevUnused = Math.max(0, prevTotalAllowance - prevUsed)

  return parseFloat(prevUnused.toFixed(1))
}

export type MonthlyLeaveSummary = {
  year: number
  month: number
  monthName: string
  totalDaysInMonth: number
  approvedLeaveDays: number
  monthlyAllowanceDays: number
  carryForwardDays: number
  paidAllowanceDays: number
  paidFullDays: number
  paidHalfDays: number
  excessLeaveDays: number
  paidLeaveRemaining: number
  perDayRate: number
  leaveDeduction: number
  grossSalary: number
  estimatedNetPay: number
}

export function getMonthDateBounds(year: number, month: number) {
  return {
    fromDate: new Date(year, month, 1).toISOString().split('T')[0],
    toDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
    totalDaysInMonth: new Date(year, month + 1, 0).getDate(),
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function calculateMonthlyLeaveSummary(
  grossSalary: number,
  leaves: LeaveRecordInput[],
  year?: number,
  month?: number,
  joiningDate?: Date | null,
  employeeCreatedAt?: Date | null
): MonthlyLeaveSummary {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? now.getMonth()
  const { totalDaysInMonth } = getMonthDateBounds(y, m)
  const totalWorkingDaysInMonth = countWorkingDaysInMonth(y, m)

  const policyStartDate = getLeavePolicyStartDate(joiningDate, employeeCreatedAt)
  const approvedLeaveDays = getApprovedLeaveDaysInMonth(leaves, y, m)
  const carryForwardDays = getCarryForwardLeaveDays(leaves, y, m, policyStartDate)
  const paidAllowanceDays = parseFloat(
    (MONTHLY_PAID_LEAVE_ALLOWANCE + carryForwardDays).toFixed(1)
  )
  const excessLeaveDays = parseFloat(
    Math.max(0, approvedLeaveDays - paidAllowanceDays).toFixed(1)
  )
  const paidLeaveRemaining = parseFloat(
    Math.max(0, paidAllowanceDays - approvedLeaveDays).toFixed(1)
  )
  const perDayRate =
    totalWorkingDaysInMonth > 0 ? grossSalary / totalWorkingDaysInMonth : 0
  const leaveDeduction = parseFloat((perDayRate * excessLeaveDays).toFixed(2))
  const estimatedNetPay = parseFloat(Math.max(0, grossSalary - leaveDeduction).toFixed(2))

  return {
    year: y,
    month: m,
    monthName: MONTH_NAMES[m],
    totalDaysInMonth,
    approvedLeaveDays,
    monthlyAllowanceDays: MONTHLY_PAID_LEAVE_ALLOWANCE,
    carryForwardDays,
    paidAllowanceDays,
    paidFullDays: MONTHLY_PAID_FULL_DAYS,
    paidHalfDays: MONTHLY_PAID_HALF_DAYS,
    excessLeaveDays,
    paidLeaveRemaining,
    perDayRate: parseFloat(perDayRate.toFixed(2)),
    leaveDeduction,
    grossSalary,
    estimatedNetPay,
  }
}
