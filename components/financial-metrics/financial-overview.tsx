"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { FinancialMetricsChart } from "@/components/financial-metrics/financial-metrics-chart"
import { FinancialRatios } from "@/components/financial-metrics/financial-ratios"
import { MaintenanceCostBreakdown } from "@/components/financial-metrics/maintenance-cost-breakdown"
import { PropertyPerformanceTable } from "@/components/financial-metrics/property-performance-table"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { useState } from "react"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"
import { fetchProperties } from "@/lib/services/properties"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function FinancialOverview({ period = "6m" }: { period?: string }) {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage } = useFormatter()
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  const { data: invoices } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts } = useSupabaseQuery(fetchApprovedMaintenanceCosts)
  const { data: properties } = useSupabaseQuery(fetchProperties)

  const buildMonthlyData = () => {
    const now = new Date()
    const monthCount = period === "1m" ? 1 : period === "3m" ? 3 : 6
    const rows = []
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      const revenue = invoices
        .filter((inv: any) => inv.status === "paid" && inv.issue_date?.substring(0, 7) === key)
        .reduce((s: number, inv: any) => s + (Number(inv.amount) || 0), 0)
      const manualExp = expensesData
        .filter((e: any) => (e.date || e.created_at)?.substring(0, 7) === key)
        .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0)
      const maintExp = maintCosts
        .filter((m: any) => m.created_at?.substring(0, 7) === key)
        .reduce((s: number, m: any) => s + (Number(m.cost) || 0), 0)
      const expenses = manualExp + maintExp
      const noi = revenue - expenses
      const roi = revenue > 0 ? noi / revenue : 0
      rows.push({ label, revenue, expenses, noi, roi })
    }
    return rows
  }

  const handleExportFormat = (format: ExportFormat) => {
    const monthlyData = buildMonthlyData()
    const headers = [t("dashboard.month"), t("financial.revenue"), t("financial.expenses"), t("financial.noi"), t("financial.roi")]
    const rows = monthlyData.map(m => [m.label, formatCurrency(m.revenue), formatCurrency(m.expenses), formatCurrency(m.noi), formatPercentage(m.roi)])
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0)
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0)
    const totalNOI = totalRevenue - totalExpenses
    const avgROI = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.roi, 0) / monthlyData.length : 0
    rows.push(["", "", "", "", ""])
    rows.push([t("common.total"), formatCurrency(totalRevenue), formatCurrency(totalExpenses), formatCurrency(totalNOI), formatPercentage(avgROI)])

    downloadExport(format, {
      headers,
      rows,
      title: t("financial.title"),
      filename: "financial-overview",
    })
  }

  const handleReportFormat = (format: ExportFormat) => {
    const monthlyData = buildMonthlyData()
    const headers = [t("dashboard.month"), t("financial.revenue"), t("financial.expenses"), t("financial.noi"), t("financial.roi")]
    const rows = monthlyData.map(m => [m.label, formatCurrency(m.revenue), formatCurrency(m.expenses), formatCurrency(m.noi), formatPercentage(m.roi)])
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0)
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0)
    const totalNOI = totalRevenue - totalExpenses
    const avgROI = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.roi, 0) / monthlyData.length : 0
    rows.push([t("common.total"), formatCurrency(totalRevenue), formatCurrency(totalExpenses), formatCurrency(totalNOI), formatPercentage(avgROI)])

    const totalPropertyValue = properties.reduce((s: number, p: any) => s + (Number(p.current_property_value) || 0), 0)
    const totalDebtService = properties.reduce((s: number, p: any) => s + (Number(p.annual_debt_service) || 0), 0)
    const totalCashInvested = properties.reduce((s: number, p: any) => s + (Number(p.total_cash_invested) || 0), 0)
    const noi = totalRevenue - totalExpenses
    const capRate = totalPropertyValue > 0 ? noi / totalPropertyValue : 0
    const expenseRatio = totalRevenue > 0 ? totalExpenses / totalRevenue : 0
    const dscr = totalDebtService > 0 ? noi / totalDebtService : 0
    const cashOnCash = totalCashInvested > 0 ? (noi - totalDebtService) / totalCashInvested : 0
    const grm = totalRevenue > 0 ? totalPropertyValue / totalRevenue : 0
    const breakEven = totalRevenue > 0 ? (totalExpenses + totalDebtService) / totalRevenue : 0

    downloadExport(format, {
      headers,
      rows,
      title: t("financial.title") + " - " + t("financial.generateReport"),
      filename: "financial-report",
      sections: [
        {
          title: t("financial.ratios"),
          headers: [t("financial.ratio"), t("common.value")],
          rows: [
            [t("financial.capRate"), formatPercentage(capRate)],
            [t("financial.operatingExpenseRatio"), formatPercentage(expenseRatio)],
            [t("financial.debtServiceCoverageRatio"), dscr.toFixed(2)],
            [t("financial.cashOnCashReturn"), formatPercentage(cashOnCash)],
            [t("financial.grossRentMultiplier"), grm.toFixed(1)],
            [t("financial.breakEvenRatio"), formatPercentage(breakEven)],
          ],
        },
      ],
    })
  }

  return (
    <>
    <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExportFormat} />
    <ExportFormatDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} onSelect={handleReportFormat} />
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("financial.title")}</CardTitle>
          <CardDescription>{t("financial.description")}</CardDescription>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)}>
            <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
            {t("financial.generateReport")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
            <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
            {t("financial.export")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("financial.overview")}</TabsTrigger>
            <TabsTrigger value="ratios">{t("financial.ratios")}</TabsTrigger>
            <TabsTrigger value="maintenance">{t("financial.maintenance")}</TabsTrigger>
            <TabsTrigger value="properties">{t("financial.properties")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <FinancialMetricsChart period={period} />
          </TabsContent>

          <TabsContent value="ratios" className="space-y-4">
            <FinancialRatios period={period} />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceCostBreakdown />
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <PropertyPerformanceTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  )
}
