"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useFormatter } from "@/hooks/use-formatter"
import { useTheme } from "next-themes"

const data = [
  {
    name: "Jan",
    income: 18000,
    expenses: 5000,
  },
  {
    name: "Feb",
    income: 19500,
    expenses: 4800,
  },
  {
    name: "Mar",
    income: 19000,
    expenses: 5200,
  },
  {
    name: "Apr",
    income: 20500,
    expenses: 5500,
  },
  {
    name: "May",
    income: 21000,
    expenses: 4900,
  },
  {
    name: "Jun",
    income: 22000,
    expenses: 6000,
  },
]

export function Overview() {
  const { formatCurrency } = useFormatter()
  const { theme } = useTheme()

  // Modern minimalist color palette
  const colors = {
    income: theme === "dark" ? "#60A5FA" : "#3B82F6", // Primary blue
    expenses: theme === "dark" ? "#FB7185" : "#F43F5E", // Soft red
    grid: theme === "dark" ? "#334155" : "#E2E8F0", // Subtle grid color
    text: theme === "dark" ? "#94A3B8" : "#64748B", // Muted text color
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          tickFormatter={(value) => `${value / 1000}k`}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
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
          formatter={(value) => <span style={{ color: colors.text }}>{value}</span>}
        />
        <Bar dataKey="income" name="Rental Income" fill={colors.income} radius={[4, 4, 0, 0]} barSize={24} />
        <Bar dataKey="expenses" name="Expenses" fill={colors.expenses} radius={[4, 4, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
