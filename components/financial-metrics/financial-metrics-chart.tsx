"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useTheme } from "next-themes"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Mock financial data for the past 12 months
const financialData = [
  { month: "Jan", revenue: 42500, expenses: 15200, noi: 27300, roi: 0.068 },
  { month: "Feb", revenue: 43200, expenses: 14800, noi: 28400, roi: 0.071 },
  { month: "Mar", revenue: 44100, expenses: 16300, noi: 27800, roi: 0.07 },
  { month: "Apr", revenue: 45000, expenses: 15900, noi: 29100, roi: 0.073 },
  { month: "May", revenue: 46200, expenses: 16100, noi: 30100, roi: 0.075 },
  { month: "Jun", revenue: 47500, expenses: 17200, noi: 30300, roi: 0.076 },
  { month: "Jul", revenue: 48100, expenses: 17800, noi: 30300, roi: 0.076 },
  { month: "Aug", revenue: 48800, expenses: 18100, noi: 30700, roi: 0.077 },
  { month: "Sep", revenue: 49200, expenses: 17500, noi: 31700, roi: 0.079 },
  { month: "Oct", revenue: 50100, expenses: 18300, noi: 31800, roi: 0.08 },
  { month: "Nov", revenue: 51200, expenses: 18700, noi: 32500, roi: 0.081 },
  { month: "Dec", revenue: 52500, expenses: 19200, noi: 33300, roi: 0.083 },
]

export function FinancialMetricsChart() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage } = useFormatter()
  const { theme } = useTheme()
  const [timeRange, setTimeRange] = useState("12months")

  // Filter data based on selected time range
  const getFilteredData = () => {
    switch (timeRange) {
      case "3months":
        return financialData.slice(-3)
      case "6months":
        return financialData.slice(-6)
      case "ytd":
        // Assuming current month is December for demo purposes
        return financialData
      default:
        return financialData
    }
  }

  const filteredData = getFilteredData()

  // Calculate summary metrics
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = filteredData.reduce((sum, item) => sum + item.expenses, 0)
  const totalNOI = filteredData.reduce((sum, item) => sum + item.noi, 0)
  const averageROI = filteredData.reduce((sum, item) => sum + item.roi, 0) / filteredData.length

  // Modern color palette
  const colors = {
    revenue: theme === "dark" ? "#60A5FA" : "#3B82F6", // Blue
    expenses: theme === "dark" ? "#FB7185" : "#F43F5E", // Red
    noi: theme === "dark" ? "#4ADE80" : "#22C55E", // Green
    roi: theme === "dark" ? "#A78BFA" : "#8B5CF6", // Purple
    grid: theme === "dark" ? "#334155" : "#E2E8F0", // Subtle grid color
    text: theme === "dark" ? "#94A3B8" : "#64748B", // Muted text color
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.totalRevenue")}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(totalRevenue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.totalExpenses")}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(totalExpenses)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.netOperatingIncome")}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(totalNOI)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.averageROI")}</CardDescription>
              <CardTitle className="text-xl">{formatPercentage(averageROI)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <div className="w-[180px]">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder={t("financial.selectTimeRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">{t("financial.last3Months")}</SelectItem>
              <SelectItem value="6months">{t("financial.last6Months")}</SelectItem>
              <SelectItem value="12months">{t("financial.last12Months")}</SelectItem>
              <SelectItem value="ytd">{t("financial.yearToDate")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
            />
            <YAxis
              yAxisId="left"
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "roi") {
                  return [formatPercentage(value), t("financial.roi")]
                }
                return [
                  formatCurrency(value),
                  name === "revenue"
                    ? t("financial.revenue")
                    : name === "expenses"
                      ? t("financial.expenses")
                      : t("financial.noi"),
                ]
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              formatter={(value) => {
                return value === "revenue"
                  ? t("financial.revenue")
                  : value === "expenses"
                    ? t("financial.expenses")
                    : value === "noi"
                      ? t("financial.noi")
                      : t("financial.roi")
              }}
            />
            <Bar yAxisId="left" dataKey="revenue" fill={colors.revenue} name="revenue" barSize={20} />
            <Bar yAxisId="left" dataKey="expenses" fill={colors.expenses} name="expenses" barSize={20} />
            <Bar yAxisId="left" dataKey="noi" fill={colors.noi} name="noi" barSize={20} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roi"
              stroke={colors.roi}
              name="roi"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
