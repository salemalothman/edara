"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchInvoices } from "@/lib/services/invoices"

export function RecentInvoices() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { data: invoices, loading } = useSupabaseQuery(fetchInvoices)

  // Show the 5 most recent invoices
  const recent = invoices.slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No invoices found</p>
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-700 border-green-200"
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid": return t("status.paid")
      case "overdue": return t("status.overdue")
      default: return t("status.pending")
    }
  }

  const getInitials = (inv: any) => {
    if (inv.tenant) {
      return `${(inv.tenant.first_name || "")[0] || ""}${(inv.tenant.last_name || "")[0] || ""}`.toUpperCase()
    }
    return "?"
  }

  const getTenantName = (inv: any) => {
    if (inv.tenant) return `${inv.tenant.first_name} ${inv.tenant.last_name}`
    return "Unknown Tenant"
  }

  const getLocation = (inv: any) => {
    const parts = []
    if (inv.unit?.name) parts.push(inv.unit.name)
    if (inv.property?.name) parts.push(inv.property.name)
    return parts.length > 0 ? parts.join(", ") : "—"
  }

  return (
    <div className="space-y-8">
      {recent.map((inv: any) => (
        <div key={inv.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(inv)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
            <p className="text-sm font-medium leading-none">{getTenantName(inv)}</p>
            <p className="text-sm text-muted-foreground">{getLocation(inv)}</p>
          </div>
          <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
            <Badge variant="outline" className={`ml-2 rtl:mr-2 rtl:ml-0 ${statusBadge(inv.status)}`}>
              {statusLabel(inv.status)}
            </Badge>
            <p className="mt-1 text-sm">{formatCurrency(Number(inv.amount) || 0)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
