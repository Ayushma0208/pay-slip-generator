/** Company calendar: Sun off; 2nd & 4th Sat off; 1st, 3rd, 5th Sat working */

export function getSaturdayOrdinalInMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  let count = 0
  for (let d = 1; d <= date.getDate(); d++) {
    if (new Date(year, month, d).getDay() === 6) count++
  }
  return count
}

export function isWorkingDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0) return false
  if (day === 6) {
    const satNum = getSaturdayOrdinalInMonth(date)
    return satNum !== 2 && satNum !== 4
  }
  return true
}

export function countWorkingDaysInRange(fromDate: string, toDate: string): number {
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  if (to < from) return 0

  let count = 0
  const cursor = new Date(from)
  while (cursor <= to) {
    if (isWorkingDay(cursor)) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export function countWorkingDaysInMonth(year: number, month: number): number {
  const to = new Date(year, month + 1, 0)
  const fromStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const toStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`
  return countWorkingDaysInRange(fromStr, toStr)
}
