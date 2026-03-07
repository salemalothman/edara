"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchPropertyById } from "@/lib/services/properties"
import { fetchTenantsByProperty } from "@/lib/services/tenants"

export function PropertyTenantsContent({ propertyId }: { propertyId: string }) {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()
  const { data: property, loading: loadingProperty } = useSupabaseQuery(() => fetchPropertyById(propertyId), [propertyId])
  const { data: tenants, loading: loadingTenants } = useSupabaseQuery(() => fetchTenantsByProperty(propertyId), [propertyId])

  const loading = loadingProperty || loadingTenants

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <BackToDashboard route={`/properties/${propertyId}`} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {loading ? <Skeleton className="h-8 w-48 inline-block" /> : `${property?.name} — ${t("common.tenants")}`}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.tenants")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Leases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                tenants.filter((t: any) => t.lease_end_date && new Date(t.lease_end_date) > new Date()).length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.tenants")}</CardTitle>
          <CardDescription>Tenants in this property</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Lease End</TableHead>
                <TableHead>Rent</TableHead>
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
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tenants found for this property.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant: any) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.first_name} {tenant.last_name}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.phone || "—"}</TableCell>
                    <TableCell>{tenant.unit?.name || "—"}</TableCell>
                    <TableCell>
                      {tenant.move_in_date ? formatDate(new Date(tenant.move_in_date)) : "—"}
                    </TableCell>
                    <TableCell>
                      {tenant.lease_end_date ? (
                        <span className={new Date(tenant.lease_end_date) < new Date() ? "text-red-600" : ""}>
                          {formatDate(new Date(tenant.lease_end_date))}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{tenant.rent ? formatCurrency(Number(tenant.rent)) : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
