import { useLanguage } from '../contexts/language-context'
import { formatCurrency, formatNumber, formatPercentage, formatDate, formatNumberWithUnit } from '../utils/format'

export function useFormatter() {
  const { language } = useLanguage()
  const locale = language === 'ar' ? 'ar-KW' : 'en-US'

  return {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, options),
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => formatCurrency(value, options),
    formatPercentage: (value: number) => formatPercentage(value),
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    formatNumberWithUnit: (value: number, unit: string) => formatNumberWithUnit(value, unit, locale),
    locale,
  }
}
