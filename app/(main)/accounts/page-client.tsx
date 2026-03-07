"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ArrowUpDown, DollarSign, Clock, Receipt, TrendingUp, Lock, LockOpen, Building2 } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"
import { fetchProperties } from "@/lib/services/properties"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"
import { cn } from "@/lib/utils"
import { isPeriodLocked } from "@/utils/period-lock"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

type SortField = "name" | "amount"
type SortDir = "asc" | "desc"

export function AccountsPageClient() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()

  const { data: invoices, loading: l1 } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData, loading: l2 } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: l3 } = useSupabaseQuery(fetchApprovedMaintenanceCosts)
  const { data: properties } = useSupabaseQuery(fetchProperties)

  const loading = l1 || l2 || l3

  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [paidSort, setPaidSort] = useState<{ field: SortField; dir: SortDir }>({ field: "amount", dir: "desc" })
  const [pendingSort, setPendingSort] = useState<{ field: SortField; dir: SortDir }>({ field: "amount", dir: "desc" })
  const [expenseSort, setExpenseSort] = useState<{ field: SortField; dir: SortDir }>({ field: "amount", dir: "desc" })
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const isLocked = isPeriodLocked(selectedMonth, selectedYear)

  // Extract available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const inv of invoices) {
      const y = inv.issue_date?.substring(0, 4)
      if (y) years.add(y)
    }
    for (const e of expensesData) {
      const y = (e.date || e.created_at)?.substring(0, 4)
      if (y) years.add(y)
    }
    for (const m of maintCosts) {
      const y = m.created_at?.substring(0, 4)
      if (y) years.add(y)
    }
    return Array.from(years).sort().reverse()
  }, [invoices, expensesData, maintCosts])

  // Filter helper
  const matchesPeriod = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false
    if (selectedYear !== "all" && dateStr.substring(0, 4) !== selectedYear) return false
    if (selectedMonth !== "all") {
      const month = dateStr.substring(5, 7)
      if (month !== selectedMonth) return false
    }
    return true
  }

  // Compute filtered data
  const { paidTenants, pendingTenants, expenses, totalPaid, totalPending, totalExpenses, netTotal } = useMemo(() => {
    let filteredInvoices = selectedMonth === "all" && selectedYear === "all"
      ? invoices
      : invoices.filter((inv: any) => matchesPeriod(inv.issue_date))
    if (propertyFilter !== "all") {
      filteredInvoices = filteredInvoices.filter((inv: any) => inv.property_id === propertyFilter)
    }

    let filteredExpenses = selectedMonth === "all" && selectedYear === "all"
      ? expensesData
      : expensesData.filter((e: any) => matchesPeriod(e.date || e.created_at))
    if (propertyFilter !== "all") {
      filteredExpenses = filteredExpenses.filter((e: any) => e.property_id === propertyFilter)
    }

    let filteredMaint = selectedMonth === "all" && selectedYear === "all"
      ? maintCosts
      : maintCosts.filter((m: any) => matchesPeriod(m.created_at))
    if (propertyFilter !== "all") {
      filteredMaint = filteredMaint.filter((m: any) => m.property_id === propertyFilter)
    }

    // Aggregate by tenant
    const paidByTenant = new Map<string, { name: string; amount: number }>()
    const pendingByTenant = new Map<string, { name: string; amount: number }>()

    for (const inv of filteredInvoices) {
      const tenantName = inv.tenant
        ? `${inv.tenant.first_name} ${inv.tenant.last_name}`
        : inv.description || `Tenant ${inv.tenant_id?.substring(0, 8) || "Unknown"}`
      const amount = Number(inv.amount) || 0
      const key = inv.tenant_id || tenantName

      if (inv.status === "paid") {
        const existing = paidByTenant.get(key)
        if (existing) existing.amount += amount
        else paidByTenant.set(key, { name: tenantName, amount })
      } else {
        const existing = pendingByTenant.get(key)
        if (existing) existing.amount += amount
        else pendingByTenant.set(key, { name: tenantName, amount })
      }
    }

    const allExpenses: { description: string; category: string; amount: number }[] = []
    for (const e of filteredExpenses) {
      allExpenses.push({
        description: e.description || e.category || "Expense",
        category: e.category || t("expenses.other"),
        amount: Number(e.amount) || 0,
      })
    }
    for (const m of filteredMaint) {
      allExpenses.push({
        description: m.title || m.category || "Maintenance",
        category: t("expenses.maintenance"),
        amount: Number(m.cost) || 0,
      })
    }

    const paid = Array.from(paidByTenant.values())
    const pending = Array.from(pendingByTenant.values())
    const tp = paid.reduce((s, t) => s + t.amount, 0)
    const tpend = pending.reduce((s, t) => s + t.amount, 0)
    const te = allExpenses.reduce((s, e) => s + e.amount, 0)

    return {
      paidTenants: paid,
      pendingTenants: pending,
      expenses: allExpenses,
      totalPaid: tp,
      totalPending: tpend,
      totalExpenses: te,
      netTotal: tp - te,
    }
  }, [invoices, expensesData, maintCosts, selectedMonth, selectedYear, propertyFilter, properties, t])

  // Sort helpers
  function sortItems<T extends { name?: string; description?: string; amount: number }>(
    items: T[],
    sort: { field: SortField; dir: SortDir }
  ): T[] {
    return [...items].sort((a, b) => {
      const nameA = (a as any).name || (a as any).description || ""
      const nameB = (b as any).name || (b as any).description || ""
      if (sort.field === "name") {
        return sort.dir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      }
      return sort.dir === "asc" ? a.amount - b.amount : b.amount - a.amount
    })
  }

  function toggleSort(
    current: { field: SortField; dir: SortDir },
    field: SortField,
    setter: (v: { field: SortField; dir: SortDir }) => void
  ) {
    if (current.field === field) {
      setter({ field, dir: current.dir === "asc" ? "desc" : "asc" })
    } else {
      setter({ field, dir: field === "amount" ? "desc" : "asc" })
    }
  }

  const handleExport = (format: ExportFormat) => {
    const paidRows: (string | number)[][] = sortItems(paidTenants, paidSort).map(r => [r.name, t("accounting.paid"), formatCurrency(r.amount)])
    paidRows.push([t("common.total"), "", formatCurrency(totalPaid)])

    const pendingRows: (string | number)[][] = sortItems(pendingTenants, pendingSort).map(r => [r.name, t("accounting.pending"), formatCurrency(r.amount)])
    pendingRows.push([t("common.total"), "", formatCurrency(totalPending)])

    const expenseRows: (string | number)[][] = sortItems(expenses, expenseSort).map(r => [r.description, r.category, formatCurrency(r.amount)])
    expenseRows.push([t("common.total"), "", formatCurrency(totalExpenses)])

    downloadExport(format, {
      headers: [t("tenants.name"), t("accounting.status"), t("invoices.amount")],
      rows: paidRows,
      title: t("accounting.accounts"),
      filename: "accounts-report",
      sections: [
        {
          title: t("accounting.pendingTenants"),
          headers: [t("tenants.name"), t("accounting.status"), t("invoices.amount")],
          rows: pendingRows,
        },
        {
          title: t("accounting.allExpenses"),
          headers: [t("expenses.description"), t("accounting.category"), t("invoices.amount")],
          rows: expenseRows,
        },
        {
          title: t("accounting.netTotal"),
          headers: [t("accounting.netTotalDesc"), ""],
          rows: [
            [t("accounting.totalPaid"), formatCurrency(totalPaid)],
            [t("accounting.totalExpenses"), formatCurrency(totalExpenses)],
            [t("accounting.netTotal"), formatCurrency(netTotal)],
          ],
        },
      ],
    })
  }

  const SortButton = ({ field, current }: { field: SortField; current: { field: SortField; dir: SortDir } }) => (
    <ArrowUpDown className={cn("inline h-3.5 w-3.5 ms-1", current.field === field ? "text-foreground" : "text-muted-foreground/50")} />
  )

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExport} />
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Page header + filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("accounting.accounts")}</h2>
            <p className="text-muted-foreground">{t("accounting.accountsDescription")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("accounting.filterByMonth")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("accounting.allMonths")}</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder={t("accounting.filterByYear")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("accounting.allYears")}</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("common.filterByProperty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allProperties")}</SelectItem>
                {properties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonth !== "all" && selectedYear !== "all" && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 py-1",
                  isLocked
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                    : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                )}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                {isLocked ? t("accounting.lockedPeriod") : t("accounting.currentPeriod")}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>

        {/* Period Lock Banner */}
        {isLocked && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {t("accounting.periodLockedDesc")}
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("accounting.totalPaid")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">{paidTenants.length} {t("accounting.paidTenants").toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("accounting.totalPending")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">{pendingTenants.length} {t("accounting.pendingTenants").toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("accounting.totalExpenses")}</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">{expenses.length} {t("accounting.allExpenses").toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("accounting.netTotal")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", netTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {formatCurrency(netTotal)}
              </div>
              <p className="text-xs text-muted-foreground">{t("accounting.netTotalDesc")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Paid Tenants Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("accounting.paidTenants")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort(paidSort, "name", setPaidSort)}
                  >
                    {t("tenants.name")}
                    <SortButton field="name" current={paidSort} />
                  </TableHead>
                  <TableHead>{t("accounting.status")}</TableHead>
                  <TableHead
                    className="text-right rtl:text-left cursor-pointer select-none"
                    onClick={() => toggleSort(paidSort, "amount", setPaidSort)}
                  >
                    {t("invoices.amount")}
                    <SortButton field="amount" current={paidSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">{t("accounting.noPaidTenants")}</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {sortItems(paidTenants, paidSort).map((tenant, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            {t("accounting.paid")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right rtl:text-left font-medium">{formatCurrency(tenant.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>{t("common.total")}</TableCell>
                      <TableCell />
                      <TableCell className="text-right rtl:text-left">{formatCurrency(totalPaid)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Tenants Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("accounting.pendingTenants")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort(pendingSort, "name", setPendingSort)}
                  >
                    {t("tenants.name")}
                    <SortButton field="name" current={pendingSort} />
                  </TableHead>
                  <TableHead>{t("accounting.status")}</TableHead>
                  <TableHead
                    className="text-right rtl:text-left cursor-pointer select-none"
                    onClick={() => toggleSort(pendingSort, "amount", setPendingSort)}
                  >
                    {t("invoices.amount")}
                    <SortButton field="amount" current={pendingSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">{t("accounting.noPendingTenants")}</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {sortItems(pendingTenants, pendingSort).map((tenant, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                            {t("accounting.pending")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right rtl:text-left font-medium">{formatCurrency(tenant.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>{t("common.total")}</TableCell>
                      <TableCell />
                      <TableCell className="text-right rtl:text-left">{formatCurrency(totalPending)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("accounting.allExpenses")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort(expenseSort, "name", setExpenseSort)}
                  >
                    {t("expenses.description")}
                    <SortButton field="name" current={expenseSort} />
                  </TableHead>
                  <TableHead>{t("accounting.category")}</TableHead>
                  <TableHead
                    className="text-right rtl:text-left cursor-pointer select-none"
                    onClick={() => toggleSort(expenseSort, "amount", setExpenseSort)}
                  >
                    {t("invoices.amount")}
                    <SortButton field="amount" current={expenseSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">{t("accounting.noExpenses")}</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {sortItems(expenses, expenseSort).map((expense, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right rtl:text-left font-medium">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>{t("common.total")}</TableCell>
                      <TableCell />
                      <TableCell className="text-right rtl:text-left">{formatCurrency(totalExpenses)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
