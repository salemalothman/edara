"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Home, Users, CreditCard, Receipt } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties } from "@/lib/services/properties"
import { fetchTenants } from "@/lib/services/tenants"
import { fetchUnits } from "@/lib/services/units"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"

export function PropertyStats({ period = "6m" }: { period?: string }) {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()

  const { data: properties, loading: loadingProps } = useSupabaseQuery(fetchProperties)
  const { data: tenants, loading: loadingTenants } = useSupabaseQuery(fetchTenants)
  const { data: units, loading: loadingUnits } = useSupabaseQuery(fetchUnits)
  const { data: invoices, loading: loadingInvoices } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData, loading: loadingExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: loadingMaintCosts } = useSupabaseQuery(fetchApprovedMaintenanceCosts)

  const loading = loadingProps || loadingTenants || loadingUnits || loadingInvoices || loadingExp || loadingMaintCosts

  // A unit is occupied if it has an active tenant assigned to it
  const occupiedUnitIds = new Set(
    tenants
      .filter((t: any) => t.unit_id && t.status !== "former")
      .map((t: any) => t.unit_id)
  )
  const vacantUnits = units.filter((u: any) => !occupiedUnitIds.has(u.id)).length

  // Calculate period start date for filtering
  const now = new Date()
  const monthCount = period === "1m" ? 1 : period === "3m" ? 3 : 6
  const periodStart = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1)
  const periodStartKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`

  const isInPeriod = (dateStr: string | undefined) => {
    if (!dateStr) return false
    return dateStr.substring(0, 7) >= periodStartKey
  }

  const totalRevenue = invoices
    .filter((inv: any) => inv.status === "paid" && isInPeriod(inv.issue_date))
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)
  const currentMonth = now.toISOString().substring(0, 7)
  const monthlyRevenue = invoices
    .filter((inv: any) => inv.status === "paid" && inv.issue_date?.substring(0, 7) === currentMonth)
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)
  const totalManualExp = expensesData
    .filter((e: any) => isInPeriod(e.date || e.created_at))
    .reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalMaintExp = maintCosts
    .filter((m: any) => isInPeriod(m.created_at))
    .reduce((s: number, m: any) => s + (m.cost || 0), 0)
  const totalExpenses = totalManualExp + totalMaintExp

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.totalProperties")}</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : properties.length}</div>
          <p className="text-xs text-muted-foreground">{units.length} {t("dashboard.totalUnits")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.activeTenants")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : tenants.length}</div>
          <p className="text-xs text-muted-foreground">{t("dashboard.acrossAllProperties")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("dashboard.vacantUnits")}</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : vacantUnits}</div>
          <p className="text-xs text-muted-foreground">
            {units.length > 0 ? `${Math.round((vacantUnits / units.length) * 100)}% ${t("dashboard.vacancyRate")}` : t("dashboard.noUnits")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("financial.totalRevenue")}</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(monthlyRevenue)} {t("expenses.thisMonth")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("financial.totalExpenses")}</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {t("expenses.manual")}: {formatCurrency(totalManualExp)} + {t("expenses.maintenance")}: {formatCurrency(totalMaintExp)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
