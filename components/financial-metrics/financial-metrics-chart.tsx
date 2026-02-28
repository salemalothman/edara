"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useTheme } from "next-themes"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function FinancialMetricsChart() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage } = useFormatter()
  const { theme } = useTheme()
  const [timeRange, setTimeRange] = useState("12months")

  const { data: invoices, loading: loadingInv } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: loadingMaint } = useSupabaseQuery(fetchMaintenanceRequests)

  const loading = loadingInv || loadingMaint

  // Build monthly data from real invoices
  const now = new Date()
  const monthCount = timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12
  const allData = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().substring(0, 7)
    const label = MONTHS[d.getMonth()]

    const monthInvoices = invoices.filter((inv: any) => inv.issue_date?.substring(0, 7) === key)
    const revenue = monthInvoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)
    const pending = monthInvoices
      .filter((inv: any) => inv.status !== "paid")
      .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)

    const maintCount = maintenance.filter((m: any) => m.created_at?.substring(0, 7) === key).length
    const noi = revenue // no expense tracking yet, so NOI = revenue
    const totalBilled = revenue + pending
    const roi = totalBilled > 0 ? revenue / totalBilled : 0

    allData.push({ month: label, revenue, expenses: pending, noi, roi })
  }

  const totalRevenue = allData.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = allData.reduce((sum, item) => sum + item.expenses, 0)
  const totalNOI = allData.reduce((sum, item) => sum + item.noi, 0)
  const averageROI = allData.length > 0 ? allData.reduce((sum, item) => sum + item.roi, 0) / allData.length : 0

  const colors = {
    revenue: theme === "dark" ? "#60A5FA" : "#3B82F6",
    expenses: theme === "dark" ? "#FB7185" : "#F43F5E",
    noi: theme === "dark" ? "#4ADE80" : "#22C55E",
    roi: theme === "dark" ? "#A78BFA" : "#8B5CF6",
    grid: theme === "dark" ? "#334155" : "#E2E8F0",
    text: theme === "dark" ? "#94A3B8" : "#64748B",
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardHeader className="p-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-28 mt-1" /></CardHeader></Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={allData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : `${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "roi") return [formatPercentage(value), t("financial.roi")]
                return [
                  formatCurrency(value),
                  name === "revenue" ? t("financial.revenue")
                    : name === "expenses" ? t("financial.expenses")
                    : t("financial.noi"),
                ]
              }}
            />
            <Legend
              formatter={(value) =>
                value === "revenue" ? t("financial.revenue")
                  : value === "expenses" ? t("financial.expenses")
                  : value === "noi" ? t("financial.noi")
                  : t("financial.roi")
              }
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
