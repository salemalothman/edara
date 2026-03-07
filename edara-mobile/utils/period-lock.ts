export function isPeriodLocked(selectedMonth: string, selectedYear: string): boolean {
  if (selectedMonth === 'all' || selectedYear === 'all') return false
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const year = parseInt(selectedYear, 10)
  const month = parseInt(selectedMonth, 10)
  if (year < currentYear) return true
  if (year === currentYear && month < currentMonth) return true
  return false
}

export function isDateInLockedPeriod(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(5, 7)
  return isPeriodLocked(month, year)
}
