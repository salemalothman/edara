"use client"

import { useState } from "react"
import { Download, Search, MoreHorizontal, Trash2 } from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useToast } from "@/hooks/use-toast"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchExpenses, fetchApprovedMaintenanceCosts, deleteExpense } from "@/lib/services/expenses"

export function ExpensesPageClient() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()
  const { toast } = useToast()
  const { data: manualExpenses, loading: expLoading, refetch: refetchExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintenanceCosts, loading: maintLoading, refetch: refetchMaint } = useSupabaseQuery(fetchApprovedMaintenanceCosts)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const loading = expLoading || maintLoading

  const refetch = () => { refetchExp(); refetchMaint() }

  // Combine both sources
  const combinedExpenses = [
    ...manualExpenses.map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      property: e.property?.name || null,
      date: e.date,
      source: "manual" as const,
    })),
    ...maintenanceCosts.map((m: any) => ({
      id: `maint-${m.id}`,
      description: m.title,
      amount: m.cost,
      category: m.category,
      property: m.property?.name || null,
      date: m.created_at?.split("T")[0],
      source: "maintenance" as const,
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""))

  // Summary stats
  const totalManual = manualExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalMaintenance = maintenanceCosts.reduce((s: number, m: any) => s + (m.cost || 0), 0)
  const totalCombined = totalManual + totalMaintenance

  // Filter by tab
  const tabFiltered = combinedExpenses.filter((exp) => {
    if (activeTab === "all") return true
    return exp.source === activeTab
  })

  // Filter by search
  const filteredExpenses = tabFiltered.filter((exp) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      exp.description?.toLowerCase().includes(q) ||
      exp.category?.toLowerCase().includes(q) ||
      exp.property?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("expenses.confirmDelete"))) return
    try {
      await deleteExpense(id)
      refetchExp()
      toast({ title: t("common.success"), description: t("expenses.deleteSuccess") })
    } catch (err: any) {
      toast({ title: t("common.error"), description: err?.message || "Failed to delete", variant: "destructive" })
    }
  }

  const handleExportFormat = (format: ExportFormat) => {
    const headers = [t("expenses.description"), t("expenses.amount"), t("expenses.category"), t("expenses.property"), t("expenses.date"), t("expenses.source")]
    const rows = filteredExpenses.map((e) => [
      e.description,
      String(e.amount),
      t(`expenses.${e.category}`),
      e.property || "—",
      e.date || "",
      t(`expenses.${e.source}`),
    ])

    downloadExport(format, {
      headers,
      rows,
      title: t("expenses.title"),
      filename: "expenses",
    })
  }

  const categoryLabel = (cat: string) => {
    const key = `expenses.${cat}`
    const translated = t(key)
    return translated !== key ? translated : cat
  }

  const sourceBadge = (source: string) => {
    return source === "maintenance"
      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      : "bg-blue-100 text-blue-800 hover:bg-blue-100"
  }

  return (
    <>
    <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExportFormat} />
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("expenses.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddExpenseDialog onSuccess={refetch} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-s-4 border-s-red-500">
          <CardHeader className="pb-2">
            <CardDescription>{t("expenses.manualExpenses")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalManual)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>{t("expenses.maintenanceCosts")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalMaintenance)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-primary">
          <CardHeader className="pb-2">
            <CardDescription>{t("expenses.combinedTotal")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalCombined)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            <TabsTrigger value="manual">{t("expenses.manual")}</TabsTrigger>
            <TabsTrigger value="maintenance">{t("expenses.maintenance")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>

        {["all", "manual", "maintenance"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
                <Input
                  placeholder={t("expenses.searchExpenses")}
                  className="h-9 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Card>
              <CardHeader className="p-4">
                <CardTitle>{t("expenses.title")}</CardTitle>
                <CardDescription>{t("expenses.manageExpenses")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("expenses.description")}</TableHead>
                      <TableHead>{t("expenses.amount")}</TableHead>
                      <TableHead>{t("expenses.category")}</TableHead>
                      <TableHead>{t("expenses.property")}</TableHead>
                      <TableHead>{t("expenses.date")}</TableHead>
                      <TableHead>{t("expenses.source")}</TableHead>
                      <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {t("expenses.noExpenses")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell className="text-red-600 font-semibold">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>{categoryLabel(expense.category)}</TableCell>
                          <TableCell>{expense.property || "—"}</TableCell>
                          <TableCell>{expense.date ? formatDate(new Date(expense.date)) : "—"}</TableCell>
                          <TableCell>
                            <Badge className={sourceBadge(expense.source)}>
                              {t(`expenses.${expense.source}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right rtl:text-left">
                            {expense.source === "manual" ? (
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
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(expense.id)}
                                  >
                                    <Trash2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("expenses.autoImported")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </>
  )
}
