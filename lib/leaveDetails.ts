import {
  getCarryForwardLeaveDays,
  getLeavePolicyStartDate,
  leaveDaysInMonth,
  type LeaveRecordInput,
  type MonthlyLeaveSummary,
} from '@/lib/leavePolicy'

export type LeaveRecordWithType = LeaveRecordInput & { leaveType: string }

export type LeaveDetailRow = {
  leaveType: string
  opening: number
  accrued: number
  credit: number
  availed: number
  expiredEncashed: number
  closing: number
}

export const PAYSLIP_LEAVE_TYPES = [
  'Bereavement Leave',
  'Comp Offs',
  'Earned Leave',
  'Education Leave',
  'Optional Holiday',
  'Paternity Leave',
  'Planned Paid Leave',
  'Sick Leave',
  'Special Leave',
  'Unpaid Leave',
] as const

const LEAVE_TYPE_MAP: Record<string, string> = {
  'Sick Leave': 'Sick Leave',
  'Earned Leave': 'Earned Leave',
  'Casual Leave': 'Planned Paid Leave',
  'Optional Holiday': 'Optional Holiday',
  'Unpaid Leave': 'Unpaid Leave',
}

function fmt(n: number): number {
  return parseFloat(n.toFixed(2))
}

function availedForType(
  leaves: LeaveRecordWithType[],
  year: number,
  month: number,
  payslipType: string
): number {
  const total = leaves.reduce((sum, leave) => {
    const mapped = LEAVE_TYPE_MAP[leave.leaveType] ?? leave.leaveType
    if (mapped !== payslipType) return sum
    return sum + leaveDaysInMonth(leave, year, month)
  }, 0)
  return fmt(total)
}

export function buildLeaveDetailsTable(
  leaves: LeaveRecordWithType[],
  summary: MonthlyLeaveSummary | null,
  year: number,
  month: number,
  joiningDate?: Date | null,
  employeeCreatedAt?: Date | null
): LeaveDetailRow[] {
  const policyStart = getLeavePolicyStartDate(joiningDate, employeeCreatedAt)
  const carryForward = getCarryForwardLeaveDays(leaves, year, month, policyStart)

  return PAYSLIP_LEAVE_TYPES.map((leaveType) => {
    if (leaveType === 'Planned Paid Leave' && summary) {
      const opening = fmt(carryForward)
      const accrued = fmt(summary.monthlyAllowanceDays)
      const availed = fmt(Math.min(summary.approvedLeaveDays, summary.paidAllowanceDays))
      const closing = fmt(summary.paidLeaveRemaining)
      return {
        leaveType,
        opening,
        accrued,
        credit: 0,
        availed,
        expiredEncashed: 0,
        closing,
      }
    }

    if (leaveType === 'Unpaid Leave' && summary) {
      const availed = fmt(summary.excessLeaveDays)
      return {
        leaveType,
        opening: 0,
        accrued: availed > 0 ? availed : 0,
        credit: 0,
        availed,
        expiredEncashed: 0,
        closing: availed,
      }
    }

    const availed = availedForType(leaves, year, month, leaveType)
    return {
      leaveType,
      opening: 0,
      accrued: availed > 0 ? availed : 0,
      credit: 0,
      availed,
      expiredEncashed: 0,
      closing: availed,
    }
  })
}
