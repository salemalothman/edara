"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"

export function TenantActivity() {
  const { formatCurrency, formatDate } = useFormatter()
  const { t } = useLanguage()
  const { data: invoices, loading: loadingInv } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: loadingMaint } = useSupabaseQuery(fetchMaintenanceRequests)

  const loading = loadingInv || loadingMaint

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid": return t("status.paid")
      case "pending": return t("status.pending")
      case "overdue": return t("status.overdue")
      case "completed": return t("status.completed")
      case "in_progress": return t("status.inProgress")
      case "assigned": return t("status.assigned")
      default: return status?.replace("_", " ") || t("status.pending")
    }
  }

  // Build activity feed from recent invoices and maintenance
  const activities: { id: string; initials: string; name: string; description: string; date: string; sortDate: string }[] = []

  for (const inv of invoices.slice(0, 10) as any[]) {
    const name = inv.tenant ? `${inv.tenant.first_name} ${inv.tenant.last_name}` : t("dashboard.unknown")
    const initials = inv.tenant
      ? `${(inv.tenant.first_name || "")[0] || ""}${(inv.tenant.last_name || "")[0] || ""}`.toUpperCase()
      : "?"
    const location = inv.property?.name || ""
    const action = inv.status === "paid"
      ? `${t("dashboard.paid")} ${formatCurrency(Number(inv.amount) || 0)}${location ? ` ${t("dashboard.for")} ${location}` : ""}`
      : `${t("dashboard.invoiceLabel")} ${inv.invoice_number || ""} — ${statusLabel(inv.status)}${location ? ` (${location})` : ""}`

    activities.push({
      id: `inv-${inv.id}`,
      initials,
      name,
      description: action,
      date: inv.updated_at || inv.issue_date || inv.created_at,
      sortDate: inv.updated_at || inv.issue_date || inv.created_at || "",
    })
  }

  for (const req of maintenance.slice(0, 5) as any[]) {
    activities.push({
      id: `maint-${req.id}`,
      initials: "MR",
      name: req.property?.name || t("dashboard.property"),
      description: `${t("dashboard.maintenancePrefix")}: ${req.title} (${statusLabel(req.status)})`,
      date: req.created_at,
      sortDate: req.created_at || "",
    })
  }

  // Sort by date descending, take 4
  activities.sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""))
  const recent = activities.slice(0, 4)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 rtl:space-x-reverse">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noRecentActivity")}</p>
  }

  return (
    <div className="space-y-4">
      {recent.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4 rtl:space-x-reverse">
          <Avatar className="mt-1">
            <AvatarFallback>{activity.initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium">{activity.name}</p>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {activity.date ? formatDate(new Date(activity.date)) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
