/**
 * Utility functions for formatting numbers, currency, and dates
 */

/**
 * Format a number with the specified options
 * @param value The number to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }): string {
  // Always use Western Arabic (Latin) numerals regardless of locale
  return new Intl.NumberFormat("en-US", {
    ...options,
    // This ensures we use Western Arabic numerals (0-9) instead of Eastern Arabic (٠-٩)
    numberingSystem: "latn",
  }).format(value)
}

/**
 * Format a currency value in Kuwaiti Dinar (KWD)
 * @param value The amount to format
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, options: Intl.NumberFormatOptions = {}): string {
  // Format with Western Arabic numerals and KWD currency
  const formatted = formatNumber(value, {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })

  // Replace "KWD" with "دينار" for Arabic locale
  return formatted.replace("KWD", "دينار")
}

/**
 * Format a percentage value
 * @param value The percentage value (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return formatNumber(value, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/**
 * Format a date according to the specified locale
 * @param date The date to format
 * @param locale The locale to use for formatting
 * @param options Additional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(locale, {
    ...options,
    // Ensure we use Western Arabic numerals for dates
    numberingSystem: "latn",
  }).format(dateObj)
}

/**
 * Format a number with unit (e.g., "24 units")
 * @param value The number value
 * @param unit The unit to append
 * @param locale The locale to use
 * @returns Formatted number with unit
 */
export function formatNumberWithUnit(value: number, unit: string, locale = "en-US"): string {
  const formattedNumber = formatNumber(value, { maximumFractionDigits: 0 })

  // For Arabic, the unit comes before the number
  if (locale === "ar") {
    return `${unit} ${formattedNumber}`
  }

  // For English and other languages, the unit comes after the number
  return `${formattedNumber} ${unit}`
}
