"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Home, Users, CreditCard } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties } from "@/lib/services/properties"
import { fetchTenants } from "@/lib/services/tenants"
import { fetchUnits } from "@/lib/services/units"
import { fetchInvoices } from "@/lib/services/invoices"

export function PropertyStats() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()

  const { data: properties, loading: loadingProps } = useSupabaseQuery(fetchProperties)
  const { data: tenants, loading: loadingTenants } = useSupabaseQuery(fetchTenants)
  const { data: units, loading: loadingUnits } = useSupabaseQuery(fetchUnits)
  const { data: invoices, loading: loadingInvoices } = useSupabaseQuery(fetchInvoices)

  const loading = loadingProps || loadingTenants || loadingUnits || loadingInvoices

  const vacantUnits = units.filter((u: any) => u.status === "vacant" || !u.status).length
  const currentMonth = new Date().toISOString().substring(0, 7)
  const monthlyRevenue = invoices
    .filter((inv: any) => inv.status === "paid" && inv.issue_date?.substring(0, 7) === currentMonth)
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : properties.length}</div>
          <p className="text-xs text-muted-foreground">{units.length} total units</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : tenants.length}</div>
          <p className="text-xs text-muted-foreground">Across all properties</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : vacantUnits}</div>
          <p className="text-xs text-muted-foreground">
            {units.length > 0 ? `${Math.round((vacantUnits / units.length) * 100)}% vacancy rate` : "No units"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : formatCurrency(monthlyRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {invoices.filter((inv: any) => inv.status === "paid" && inv.issue_date?.substring(0, 7) === currentMonth).length} paid invoices this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
