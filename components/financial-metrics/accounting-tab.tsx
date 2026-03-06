"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export interface AccountingData {
  paidTenants: { name: string; amount: number }[]
  pendingTenants: { name: string; amount: number }[]
  expenses: { description: string; amount: number }[]
  totalPaid: number
  totalPending: number
  totalExpenses: number
  netTotal: number
}

export function useAccountingData(): { data: AccountingData; loading: boolean } {
  const { data: invoices, loading: l1 } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData, loading: l2 } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: l3 } = useSupabaseQuery(fetchApprovedMaintenanceCosts)

  const loading = l1 || l2 || l3

  // Aggregate paid invoices by tenant
  const paidByTenant = new Map<string, { name: string; amount: number }>()
  const pendingByTenant = new Map<string, { name: string; amount: number }>()

  for (const inv of invoices) {
    const tenantName = inv.tenant
      ? `${inv.tenant.first_name} ${inv.tenant.last_name}`
      : inv.description || `Tenant ${inv.tenant_id?.substring(0, 8) || "Unknown"}`
    const amount = Number(inv.amount) || 0
    const key = inv.tenant_id || tenantName

    if (inv.status === "paid") {
      const existing = paidByTenant.get(key)
      if (existing) {
        existing.amount += amount
      } else {
        paidByTenant.set(key, { name: tenantName, amount })
      }
    } else {
      const existing = pendingByTenant.get(key)
      if (existing) {
        existing.amount += amount
      } else {
        pendingByTenant.set(key, { name: tenantName, amount })
      }
    }
  }

  const paidTenants = Array.from(paidByTenant.values()).sort((a, b) => b.amount - a.amount)
  const pendingTenants = Array.from(pendingByTenant.values()).sort((a, b) => b.amount - a.amount)

  // Combine manual expenses and maintenance costs
  const allExpenses: { description: string; amount: number }[] = []
  for (const e of expensesData) {
    allExpenses.push({
      description: e.description || e.category || "Expense",
      amount: Number(e.amount) || 0,
    })
  }
  for (const m of maintCosts) {
    allExpenses.push({
      description: m.title || m.category || "Maintenance",
      amount: Number(m.cost) || 0,
    })
  }

  const totalPaid = paidTenants.reduce((s, t) => s + t.amount, 0)
  const totalPending = pendingTenants.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)
  const netTotal = totalPaid - totalExpenses

  return {
    data: { paidTenants, pendingTenants, expenses: allExpenses, totalPaid, totalPending, totalExpenses, netTotal },
    loading,
  }
}

export function AccountingTab() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { data, loading } = useAccountingData()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Paid Tenants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("accounting.paidTenants")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenants.name")}</TableHead>
                <TableHead className="text-right rtl:text-left">{t("invoices.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.paidTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">{t("accounting.noPaidTenants")}</TableCell>
                </TableRow>
              ) : (
                <>
                  {data.paidTenants.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right rtl:text-left">{formatCurrency(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>{t("common.total")}</TableCell>
                    <TableCell className="text-right rtl:text-left">{formatCurrency(data.totalPaid)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Tenants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("accounting.pendingTenants")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenants.name")}</TableHead>
                <TableHead className="text-right rtl:text-left">{t("invoices.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">{t("accounting.noPendingTenants")}</TableCell>
                </TableRow>
              ) : (
                <>
                  {data.pendingTenants.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right rtl:text-left">{formatCurrency(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>{t("common.total")}</TableCell>
                    <TableCell className="text-right rtl:text-left">{formatCurrency(data.totalPending)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("accounting.allExpenses")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expenses.description")}</TableHead>
                <TableHead className="text-right rtl:text-left">{t("invoices.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">{t("accounting.noExpenses")}</TableCell>
                </TableRow>
              ) : (
                <>
                  {data.expenses.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell className="text-right rtl:text-left">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>{t("common.total")}</TableCell>
                    <TableCell className="text-right rtl:text-left">{formatCurrency(data.totalExpenses)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net Total Summary */}
      <Separator />
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("accounting.netTotalDesc")}</p>
              <p className="text-xs text-muted-foreground">
                {t("accounting.paidTenants")}: {formatCurrency(data.totalPaid)} - {t("accounting.allExpenses")}: {formatCurrency(data.totalExpenses)}
              </p>
            </div>
            <div className={`text-3xl font-bold ${data.netTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(data.netTotal)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
