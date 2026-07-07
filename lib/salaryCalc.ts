export const PROFESSIONAL_TAX = 200

const MEDICAL_RATIO = 1250 / 52000
const CONVEYANCE_RATIO = 1600 / 52000

export type SalaryLineItem = { label: string; amount: number }

export type SalaryCalculationOptions = {
  finalSettlement?: number
  reimbursements?: SalaryLineItem[]
  overtimeHours?: number
}

export type SalaryCalculation = ReturnType<typeof calculateSalary>

export function calculateSalary(
  grossSalary: number,
  fromDate: string,
  toDate: string,
  lopDays: number,
  customDeductions: SalaryLineItem[],
  options: SalaryCalculationOptions = {}
) {
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  const year = from.getFullYear()
  const month = from.getMonth()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const msPerDay = 1000 * 60 * 60 * 24
  const daysInRange = Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1
  const effectivePaidDays = Math.max(0, daysInRange - lopDays)
  const ratio = totalDaysInMonth > 0 ? effectivePaidDays / totalDaysInMonth : 1

  const stdBasic = parseFloat((grossSalary * 0.5).toFixed(2))
  const stdHRA = parseFloat((stdBasic * 0.4).toFixed(2))
  const stdMedical = parseFloat((grossSalary * MEDICAL_RATIO).toFixed(2))
  const stdConveyance = parseFloat((grossSalary * CONVEYANCE_RATIO).toFixed(2))
  const stdSpecial = parseFloat(
    (grossSalary - stdBasic - stdHRA - stdMedical - stdConveyance).toFixed(2)
  )

  const actualBasic = parseFloat((stdBasic * ratio).toFixed(2))
  const actualHRA = parseFloat((stdHRA * ratio).toFixed(2))
  const actualMedical = parseFloat((stdMedical * ratio).toFixed(2))
  const actualConveyance = parseFloat((stdConveyance * ratio).toFixed(2))
  const actualSpecial = parseFloat((stdSpecial * ratio).toFixed(2))
  const finalSettlement = parseFloat(String(options.finalSettlement ?? 0)) || 0

  const salaryEarnings = actualBasic + actualHRA + actualMedical + actualConveyance + actualSpecial
  const totalEarningsA = parseFloat((salaryEarnings + finalSettlement).toFixed(2))

  const pfEmployee = parseFloat((actualBasic * 0.12).toFixed(2))
  const totalPfDeductionsB = pfEmployee

  const professionalTax = PROFESSIONAL_TAX
  const otherTaxDeductions = customDeductions
    .filter((d) => d.label)
    .map((d) => ({ label: d.label, amount: parseFloat(String(d.amount)) || 0 }))
  const otherTaxTotal = parseFloat(
    otherTaxDeductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)
  )
  const totalTaxesDeductionsC = parseFloat((professionalTax + otherTaxTotal).toFixed(2))

  const reimbursements = (options.reimbursements ?? [])
    .filter((r) => r.label)
    .map((r) => ({ label: r.label, amount: parseFloat(String(r.amount)) || 0 }))
  const totalReimbursementsD = parseFloat(
    reimbursements.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
  )

  const pfEmployer = pfEmployee
  const pfOtherCharges = parseFloat((pfEmployee / 12).toFixed(2))
  const totalOtherComponentsE = parseFloat((pfEmployer + pfOtherCharges).toFixed(2))

  const totalDeductions = parseFloat((totalPfDeductionsB + totalTaxesDeductionsC).toFixed(2))
  const netPay = parseFloat(
    (totalEarningsA - totalPfDeductionsB - totalTaxesDeductionsC + totalReimbursementsD).toFixed(2)
  )
  const totalCost = parseFloat((totalEarningsA + totalOtherComponentsE).toFixed(2))

  const overtimeHours = parseFloat(String(options.overtimeHours ?? 0)) || 0

  return {
    grossSalary,
    stdBasic,
    stdHRA,
    stdMedical,
    stdConveyance,
    stdSpecial,
    actualBasic,
    actualHRA,
    actualMedical,
    actualConveyance,
    actualSpecial,
    finalSettlement,
    totalEarningsA,
    pf: pfEmployee,
    pfEmployee,
    totalPfDeductionsB,
    professionalTax,
    otherTaxDeductions,
    totalTaxesDeductionsC,
    reimbursements,
    totalReimbursementsD,
    pfEmployer,
    pfOtherCharges,
    totalOtherComponentsE,
    customDeductions: otherTaxDeductions,
    totalDeductions,
    netPay,
    totalCost,
    actualGross: totalEarningsA,
    effectivePaidDays,
    lopDays,
    totalDaysInMonth,
    daysInRange,
    overtimeHours,
    fromDate,
    toDate,
  }
}
