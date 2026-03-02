"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useFormatter } from "@/hooks/use-formatter"
import { useTheme } from "next-themes"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function Overview() {
  const { formatCurrency } = useFormatter()
  const { theme } = useTheme()

  const { data: invoices, loading: loadingInv } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData, loading: loadingExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: loadingMaint } = useSupabaseQuery(fetchApprovedMaintenanceCosts)

  const loading = loadingInv || loadingExp || loadingMaint

  // Build monthly data from real invoices + expenses for last 6 months
  const now = new Date()
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().substring(0, 7) // "YYYY-MM"
    const label = MONTHS[d.getMonth()]

    const income = invoices
      .filter((inv: any) => inv.status === "paid" && inv.issue_date?.substring(0, 7) === key)
      .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)

    const manualExp = expensesData
      .filter((e: any) => (e.date || e.created_at)?.substring(0, 7) === key)
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const maintExp = maintCosts
      .filter((m: any) => m.created_at?.substring(0, 7) === key)
      .reduce((sum: number, m: any) => sum + (m.cost || 0), 0)

    chartData.push({ name: label, income, expenses: manualExp + maintExp })
  }

  const colors = {
    income: theme === "dark" ? "#60A5FA" : "#3B82F6",
    expenses: theme === "dark" ? "#FB7185" : "#F43F5E",
    grid: theme === "dark" ? "#334155" : "#E2E8F0",
    text: theme === "dark" ? "#94A3B8" : "#64748B",
  }

  if (loading) {
    return <Skeleton className="w-full h-[350px]" />
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={colors.text}
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: colors.grid }}
          dy={10}
        />
        <YAxis
          stroke={colors.text}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : `${value}`}
          width={40}
        />
        <Tooltip
          formatter={(value: any, name: string) => formatCurrency(Number(value) || 0)}
          labelFormatter={(label) => `Month: ${label}`}
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1E293B" : "#FFFFFF",
            borderColor: colors.grid,
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          itemStyle={{ color: colors.text }}
          labelStyle={{ fontWeight: "bold", marginBottom: "0.5rem" }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "1rem" }}
          formatter={(value) => <span style={{ color: colors.text }}>{value === "income" ? "Rental Income" : "Expenses"}</span>}
        />
        <Bar dataKey="income" name="income" fill={colors.income} radius={[4, 4, 0, 0]} barSize={24} />
        <Bar dataKey="expenses" name="expenses" fill={colors.expenses} radius={[4, 4, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
