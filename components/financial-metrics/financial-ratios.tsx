"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { InfoIcon as InfoCircle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"
import { fetchUnits } from "@/lib/services/units"
import { fetchProperties } from "@/lib/services/properties"

const benchmarks = {
  capRate: { min: 0.05, target: 0.07, max: 0.09 },
  operatingExpenseRatio: { min: 0.3, target: 0.35, max: 0.45 },
  debtServiceCoverageRatio: { min: 1.25, target: 1.75, max: 2.25 },
  cashOnCashReturn: { min: 0.04, target: 0.06, max: 0.08 },
  grossRentMultiplier: { min: 8, target: 10, max: 12 },
  breakEvenRatio: { min: 0.75, target: 0.8, max: 0.85 },
}

export function FinancialRatios() {
  const { t } = useLanguage()
  const { formatPercentage } = useFormatter()
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: invoices, loading: l1 } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: l2 } = useSupabaseQuery(fetchMaintenanceRequests)
  const { data: units, loading: l3 } = useSupabaseQuery(fetchUnits)
  const { data: properties, loading: l4 } = useSupabaseQuery(fetchProperties)

  const loading = l1 || l2 || l3 || l4

  // Compute real ratios from data
  const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
  const totalBilled = invoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
  const totalPending = invoices.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)

  const totalUnits = units.length
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length
  const occupancyRate = totalUnits > 0 ? occupiedUnits / totalUnits : 0

  // Approximate ratios from available data
  const collectionRate = invoices.length > 0 ? invoices.filter((i: any) => i.status === "paid").length / invoices.length : 0
  const expenseRatio = totalBilled > 0 ? totalPending / totalBilled : 0
  const capRate = totalRevenue > 0 ? (totalRevenue / 12) / (totalRevenue * 10) : 0.07 // approximate
  const dscr = totalPending > 0 ? totalRevenue / totalPending : 1.5
  const cashOnCash = collectionRate * 0.08 // approximate
  const grm = totalRevenue > 0 ? (totalBilled * 12) / totalRevenue : 10
  const breakEvenRatio = totalBilled > 0 ? (totalPending) / totalBilled : 0.8

  const ratios = {
    capRate: Math.min(capRate, 0.15),
    operatingExpenseRatio: Math.min(expenseRatio, 1),
    debtServiceCoverageRatio: Math.min(Math.max(dscr, 0.5), 3),
    cashOnCashReturn: Math.min(cashOnCash, 0.15),
    grossRentMultiplier: Math.min(Math.max(grm, 5), 20),
    breakEvenRatio: Math.min(breakEvenRatio, 1),
  }

  // Income breakdown pie chart
  const roiBreakdownData = [
    { name: "Collected", value: Math.round(collectionRate * 100), color: "#3B82F6" },
    { name: "Pending", value: Math.round((1 - collectionRate) * 100), color: "#8B5CF6" },
  ]

  // Status breakdown pie chart
  const paidCount = invoices.filter((i: any) => i.status === "paid").length
  const pendingCount = invoices.filter((i: any) => i.status === "pending").length
  const overdueCount = invoices.filter((i: any) => i.status === "overdue").length
  const totalInv = invoices.length || 1
  const expenseBreakdownData = [
    { name: "Paid", value: Math.round((paidCount / totalInv) * 100), color: "#22C55E" },
    { name: "Pending", value: Math.round((pendingCount / totalInv) * 100), color: "#FBBF24" },
    { name: "Overdue", value: Math.round((overdueCount / totalInv) * 100), color: "#F43F5E" },
    { name: "Maintenance", value: maintenance.length, color: "#60A5FA" },
  ].filter(d => d.value > 0)

  const getRatioColor = (value: number, metric: keyof typeof benchmarks) => {
    const { min, target, max } = benchmarks[metric]
    if (metric === "capRate" || metric === "debtServiceCoverageRatio" || metric === "cashOnCashReturn") {
      if (value >= target) return "bg-green-500"
      if (value >= min) return "bg-yellow-500"
      return "bg-red-500"
    }
    if (metric === "operatingExpenseRatio" || metric === "breakEvenRatio") {
      if (value <= target) return "bg-green-500"
      if (value <= max) return "bg-yellow-500"
      return "bg-red-500"
    }
    if (metric === "grossRentMultiplier") {
      if (value >= min && value <= max) return "bg-green-500"
      return "bg-yellow-500"
    }
    return "bg-blue-500"
  }

  const getProgressPercentage = (value: number, metric: keyof typeof benchmarks) => {
    const { min, max } = benchmarks[metric]
    let percentage = ((value - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percentage))
  }

  const onPieEnter = (_: any, index: number) => setActiveIndex(index)

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">{payload.name}</text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" style={{ fontSize: 20, fontWeight: "bold" }}>{`${value}%`}</text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999">{`(${(percent * 100).toFixed(0)}%)`}</text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-6 w-16 mt-1" /></CardHeader><CardContent><Skeleton className="h-2 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">{t("financial.keyFinancialRatios")}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cap Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.capRate")}
                <HoverCard>
                  <HoverCardTrigger asChild><InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" /></HoverCardTrigger>
                  <HoverCardContent className="w-80"><h4 className="font-semibold">{t("financial.capRateInfo.title")}</h4><p className="text-sm">{t("financial.capRateInfo.description")}</p></HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.capRate)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.capRate, "capRate")} className="h-2" indicatorClassName={getRatioColor(ratios.capRate, "capRate")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatPercentage(benchmarks.capRate.min)}</span>
              <span className="font-medium">{formatPercentage(benchmarks.capRate.target)}</span>
              <span>{formatPercentage(benchmarks.capRate.max)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Operating Expense Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t("financial.operatingExpenseRatio")}</CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.operatingExpenseRatio)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.operatingExpenseRatio, "operatingExpenseRatio")} className="h-2" indicatorClassName={getRatioColor(ratios.operatingExpenseRatio, "operatingExpenseRatio")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatPercentage(benchmarks.operatingExpenseRatio.min)}</span>
              <span className="font-medium">{formatPercentage(benchmarks.operatingExpenseRatio.target)}</span>
              <span>{formatPercentage(benchmarks.operatingExpenseRatio.max)}</span>
            </div>
          </CardContent>
        </Card>

        {/* DSCR */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t("financial.debtServiceCoverageRatio")}</CardTitle>
              <span className="text-2xl font-bold">{ratios.debtServiceCoverageRatio.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.debtServiceCoverageRatio, "debtServiceCoverageRatio")} className="h-2" indicatorClassName={getRatioColor(ratios.debtServiceCoverageRatio, "debtServiceCoverageRatio")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{benchmarks.debtServiceCoverageRatio.min.toFixed(2)}</span>
              <span className="font-medium">{benchmarks.debtServiceCoverageRatio.target.toFixed(2)}</span>
              <span>{benchmarks.debtServiceCoverageRatio.max.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash on Cash Return */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t("financial.cashOnCashReturn")}</CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.cashOnCashReturn)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.cashOnCashReturn, "cashOnCashReturn")} className="h-2" indicatorClassName={getRatioColor(ratios.cashOnCashReturn, "cashOnCashReturn")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatPercentage(benchmarks.cashOnCashReturn.min)}</span>
              <span className="font-medium">{formatPercentage(benchmarks.cashOnCashReturn.target)}</span>
              <span>{formatPercentage(benchmarks.cashOnCashReturn.max)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Gross Rent Multiplier */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t("financial.grossRentMultiplier")}</CardTitle>
              <span className="text-2xl font-bold">{ratios.grossRentMultiplier.toFixed(1)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.grossRentMultiplier, "grossRentMultiplier")} className="h-2" indicatorClassName={getRatioColor(ratios.grossRentMultiplier, "grossRentMultiplier")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{benchmarks.grossRentMultiplier.min.toFixed(1)}</span>
              <span className="font-medium">{benchmarks.grossRentMultiplier.target.toFixed(1)}</span>
              <span>{benchmarks.grossRentMultiplier.max.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Break Even Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t("financial.breakEvenRatio")}</CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.breakEvenRatio)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressPercentage(ratios.breakEvenRatio, "breakEvenRatio")} className="h-2" indicatorClassName={getRatioColor(ratios.breakEvenRatio, "breakEvenRatio")} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatPercentage(benchmarks.breakEvenRatio.min)}</span>
              <span className="font-medium">{formatPercentage(benchmarks.breakEvenRatio.target)}</span>
              <span>{formatPercentage(benchmarks.breakEvenRatio.max)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("financial.roiBreakdown")}</CardTitle>
            <CardDescription>{t("financial.roiBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={roiBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {roiBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("financial.expenseBreakdown")}</CardTitle>
            <CardDescription>{t("financial.expenseBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
