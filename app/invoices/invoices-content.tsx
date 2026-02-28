"use client"

import { useState, useMemo } from "react"
import { Download, MoreHorizontal, CalendarRange, DollarSign, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddInvoiceDialog } from "@/components/invoices/add-invoice-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useToast } from "@/hooks/use-toast"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices, updateInvoice, deleteInvoice } from "@/lib/services/invoices"

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function InvoicesContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()
  const { toast } = useToast()
  const { data: invoices, loading, error, refetch } = useSupabaseQuery(fetchInvoices)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")

  // Build available months from invoice data
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    for (const inv of invoices) {
      const d = (inv as any).issue_date
      if (d) months.add(d.substring(0, 7))
    }
    return Array.from(months).sort().reverse()
  }, [invoices])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateInvoice(id, { status: newStatus })
      refetch()
      toast({ title: t("common.success") || "Success", description: `Invoice marked as ${newStatus}` })
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: err?.message || "Failed to update status", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return
    try {
      await deleteInvoice(id)
      refetch()
      toast({ title: t("common.success") || "Success", description: "Invoice deleted" })
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: err?.message || "Failed to delete", variant: "destructive" })
    }
  }

  // Filter pipeline: month → tab → search
  const monthFiltered = useMemo(() => {
    if (monthFilter === "all") return invoices
    return invoices.filter((inv: any) => inv.issue_date?.startsWith(monthFilter))
  }, [invoices, monthFilter])

  const tabFiltered = monthFiltered.filter((inv: any) => {
    if (activeTab === "all") return true
    return inv.status === activeTab
  })

  const filteredInvoices = tabFiltered.filter((inv: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.tenant?.first_name?.toLowerCase().includes(q) ||
      inv.tenant?.last_name?.toLowerCase().includes(q) ||
      inv.property?.name?.toLowerCase().includes(q) ||
      inv.unit?.name?.toLowerCase().includes(q) ||
      inv.description?.toLowerCase().includes(q)
    )
  })

  // Monthly summary stats (based on month filter, before tab/search)
  const monthlySummary = useMemo(() => {
    const data = monthFilter === "all" ? invoices : monthFiltered
    let paid = 0, pending = 0, overdue = 0, paidCount = 0, total = 0
    for (const inv of data as any[]) {
      const amount = Number(inv.amount) || 0
      total++
      if (inv.status === "paid") { paid += amount; paidCount++ }
      else if (inv.status === "overdue") { overdue += amount }
      else { pending += amount }
    }
    return { paid, pending, overdue, paidCount, total }
  }, [invoices, monthFiltered, monthFilter])

  const handleExport = () => {
    const headers = ["Invoice #", "Tenant", "Property/Unit", "Issue Date", "Due Date", "Amount", "Status"]
    const rows = filteredInvoices.map((inv: any) => [
      inv.invoice_number,
      inv.tenant ? `${inv.tenant.first_name} ${inv.tenant.last_name}` : "—",
      `${inv.property?.name || "—"}${inv.unit?.name ? `, ${inv.unit.name}` : ""}`,
      inv.issue_date,
      inv.due_date,
      inv.amount,
      inv.status || "pending",
    ])
    const csv = [headers, ...rows].map(row => row.map((c: any) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices${monthFilter !== "all" ? `-${monthFilter}` : ""}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid": return t("status.paid")
      case "pending": return t("status.pending")
      case "overdue": return t("status.overdue")
      default: return status || "pending"
    }
  }

  const fmtMonthLabel = (key: string) => {
    const [year, month] = key.split('-')
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
  }

  const renderTable = () => (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
          <Input
            placeholder="Search invoices..."
            className="h-9 w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Card>
        <CardHeader className="p-4">
          <CardTitle>
            {activeTab === "all" ? "All Invoices" : statusLabel(activeTab)}
            {monthFilter !== "all" && <span className="text-muted-foreground font-normal"> — {fmtMonthLabel(monthFilter)}</span>}
          </CardTitle>
          <CardDescription>Manage your invoices and payment records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property/Unit</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-600">
                    Error loading invoices: {error}
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {invoice.tenant ? `${invoice.tenant.first_name} ${invoice.tenant.last_name}` : "—"}
                    </TableCell>
                    <TableCell>
                      {invoice.property?.name || "—"}
                      {invoice.unit?.name ? `, ${invoice.unit.name}` : ""}
                    </TableCell>
                    <TableCell>{formatDate(new Date(invoice.issue_date))}</TableCell>
                    <TableCell>{formatDate(new Date(invoice.due_date))}</TableCell>
                    <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.status === "paid" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                        invoice.status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                        invoice.status === "overdue" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                        "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }>
                        {statusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Change Status</DropdownMenuLabel>
                          {invoice.status !== "paid" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "paid")}>
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== "pending" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "pending")}>
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== "overdue" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "overdue")}>
                              Mark as Overdue
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("common.invoices")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddInvoiceDialog onSuccess={refetch} />
        </div>
      </div>

      {/* Month filter + summary strip */}
      <div className="flex items-center gap-3">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map((m) => (
              <SelectItem key={m} value={m}>{fmtMonthLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {monthFilter !== "all" && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setMonthFilter("all")}>
            Clear
          </Button>
        )}
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {monthFilter !== "all" ? fmtMonthLabel(monthFilter) : "Total"} Collected
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlySummary.paid)}</div>
              <p className="text-xs text-muted-foreground mt-1">{monthlySummary.paidCount} of {monthlySummary.total} invoices paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(monthlySummary.pending)}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlySummary.overdue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Past due date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(monthlySummary.paid + monthlySummary.pending + monthlySummary.overdue)}
              </div>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden flex">
                {monthlySummary.paid + monthlySummary.pending + monthlySummary.overdue > 0 && (
                  <>
                    <div className="h-full bg-green-500" style={{ width: `${(monthlySummary.paid / (monthlySummary.paid + monthlySummary.pending + monthlySummary.overdue)) * 100}%` }} />
                    <div className="h-full bg-yellow-500" style={{ width: `${(monthlySummary.pending / (monthlySummary.paid + monthlySummary.pending + monthlySummary.overdue)) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(monthlySummary.overdue / (monthlySummary.paid + monthlySummary.pending + monthlySummary.overdue)) * 100}%` }} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="paid">{t("status.paid")}</TabsTrigger>
            <TabsTrigger value="pending">{t("status.pending")}</TabsTrigger>
            <TabsTrigger value="overdue">{t("status.overdue")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="paid" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="pending" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="overdue" className="space-y-4">{renderTable()}</TabsContent>
      </Tabs>
    </div>
  )
}
