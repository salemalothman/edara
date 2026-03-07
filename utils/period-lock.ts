/**
 * Determines if a given month/year period is locked (read-only).
 * A period is locked once the calendar month has concluded.
 * "all" values mean no specific period is selected, so not locked.
 */
export function isPeriodLocked(selectedMonth: string, selectedYear: string): boolean {
  if (selectedMonth === "all" || selectedYear === "all") return false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-based

  const year = parseInt(selectedYear, 10)
  const month = parseInt(selectedMonth, 10)

  if (year < currentYear) return true
  if (year === currentYear && month < currentMonth) return true

  return false
}

/**
 * Checks if a specific date string (YYYY-MM-DD or YYYY-MM-...) falls in a locked period.
 * Returns true if the date's month has already concluded.
 */
export function isDateInLockedPeriod(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false

  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(5, 7)

  return isPeriodLocked(month, year)
}
