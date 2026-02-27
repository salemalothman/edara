"use client"

import { useLanguage } from "@/hooks/use-language"
import { formatCurrency, formatNumber, formatPercentage, formatDate, formatNumberWithUnit } from "@/utils/format"

/**
 * Hook for formatting numbers, currency, and dates based on the current language
 */
export function useFormatter() {
  const { language } = useLanguage()

  // Determine the locale based on the current language
  const locale = language === "ar" ? "ar-KW" : "en-US"

  return {
    /**
     * Format a number according to the current locale
     */
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, options),

    /**
     * Format a currency value in Kuwaiti Dinar
     */
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => formatCurrency(value, options),

    /**
     * Format a percentage value
     */
    formatPercentage: (value: number) => formatPercentage(value),

    /**
     * Format a date according to the current locale
     */
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),

    /**
     * Format a number with a unit (e.g., "24 units" or "وحدة 24")
     */
    formatNumberWithUnit: (value: number, unit: string) => formatNumberWithUnit(value, unit, locale),

    /**
     * The current locale
     */
    locale,
  }
}
