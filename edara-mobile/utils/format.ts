export function formatNumber(value: number, options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }): string {
  return new Intl.NumberFormat("en-US", {
    ...options,
    numberingSystem: "latn",
  }).format(value)
}

export function formatCurrency(value: number, options: Intl.NumberFormatOptions = {}): string {
  const formatted = formatNumber(value, {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
  return formatted.replace("KWD", "دينار")
}

export function formatPercentage(value: number): string {
  return formatNumber(value, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

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
    numberingSystem: "latn",
  }).format(dateObj)
}

export function formatNumberWithUnit(value: number, unit: string, locale = "en-US"): string {
  const formattedNumber = formatNumber(value, { maximumFractionDigits: 0 })
  if (locale === "ar") {
    return `${unit} ${formattedNumber}`
  }
  return `${formattedNumber} ${unit}`
}
