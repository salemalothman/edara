"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/overview"
import { RecentInvoices } from "@/components/recent-invoices"
import { PropertyStats } from "@/components/property-stats"
import { MaintenanceRequests } from "@/components/maintenance-requests"
import { TenantActivity } from "@/components/tenant-activity"
import { ModuleCards } from "@/components/module-cards"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FinancialOverview } from "@/components/financial-metrics/financial-overview"
import { DashboardHeader } from "@/components/dashboard-header"
import { InteractiveButton } from "@/components/ui/interactive-button"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchUnits } from "@/lib/services/units"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"
import { fetchProperties } from "@/lib/services/properties"
import { fetchExpenses, fetchApprovedMaintenanceCosts } from "@/lib/services/expenses"
import { fetchTenants } from "@/lib/services/tenants"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsTab } from "@/components/notifications/notifications-tab"
import { useFormatter } from "@/hooks/use-formatter"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"

function AnalyticsTab() {
  const { t } = useLanguage()
  const { data: units, loading: loadingUnits } = useSupabaseQuery(fetchUnits)
  const { data: tenants, loading: loadingTenants } = useSupabaseQuery(fetchTenants)
  const { data: invoices, loading: loadingInv } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: loadingMaint } = useSupabaseQuery(fetchMaintenanceRequests)

  const loading = loadingUnits || loadingTenants || loadingInv || loadingMaint

  const occupiedUnitIds = new Set(
    tenants
      .filter((t: any) => t.unit_id && t.status !== "former")
      .map((t: any) => t.unit_id)
  )
  const totalUnits = units.length
  const occupiedUnits = units.filter((u: any) => occupiedUnitIds.has(u.id)).length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((i: any) => i.status === "paid").length
  const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0

  const completedMaint = maintenance.filter((m: any) => m.status === "completed").length
  const pendingMaint = maintenance.filter((m: any) => m.status === "pending" || m.status === "assigned" || m.status === "in_progress").length

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.occupancyRate")}</CardTitle>
            <CardDescription>{t("dashboard.currentOccupancy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{occupancyRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">{occupiedUnits} {t("dashboard.of")} {totalUnits} {t("dashboard.unitsOccupied")}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.collectionRate")}</CardTitle>
            <CardDescription>{t("dashboard.collectionEfficiency")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{collectionRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">{paidInvoices} {t("dashboard.of")} {totalInvoices} {t("dashboard.invoicesPaid")}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.maintenance")}</CardTitle>
            <CardDescription>{t("dashboard.requestStatusOverview")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{maintenance.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">{completedMaint} {t("dashboard.completed")}, {pendingMaint} {t("dashboard.open")}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { formatCurrency } = useFormatter()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const { data: properties } = useSupabaseQuery(fetchProperties)
  const { data: units } = useSupabaseQuery(fetchUnits)
  const { data: dashTenants } = useSupabaseQuery(fetchTenants)
  const { data: invoices } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts } = useSupabaseQuery(fetchApprovedMaintenanceCosts)

  const handleAddProperty = () => {
    router.push("/properties")
  }

  const handleExportClick = async () => {
    setExportDialogOpen(true)
  }

  const handleExportFormat = (format: ExportFormat) => {
    const now = new Date()
    const monthCount = selectedPeriod === "1m" ? 1 : selectedPeriod === "3m" ? 3 : 6
    const periodStart = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1)
    const periodStartKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`
    const isInPeriod = (dateStr: string | undefined) => {
      if (!dateStr) return false
      return dateStr.substring(0, 7) >= periodStartKey
    }

    const headers = [
      t("properties.name"),
      t("dashboard.totalUnits"),
      t("dashboard.occupied"),
      t("dashboard.vacantUnits"),
      t("financial.totalRevenue"),
      t("financial.totalExpenses"),
    ]
    const activeTenantUnitIds = new Set(
      dashTenants
        .filter((t: any) => t.unit_id && t.status !== "former")
        .map((t: any) => t.unit_id)
    )
    const rows = properties.map((prop: any) => {
      const propUnits = units.filter((u: any) => u.property_id === prop.id)
      const occupied = propUnits.filter((u: any) => activeTenantUnitIds.has(u.id)).length
      const vacant = propUnits.length - occupied
      const revenue = invoices
        .filter((inv: any) => inv.status === "paid" && inv.property_id === prop.id && isInPeriod(inv.issue_date))
        .reduce((s: number, inv: any) => s + (Number(inv.amount) || 0), 0)
      const manualExp = expensesData
        .filter((e: any) => e.property_id === prop.id && isInPeriod(e.date || e.created_at))
        .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0)
      const maintExp = maintCosts
        .filter((m: any) => m.property_id === prop.id && isInPeriod(m.created_at))
        .reduce((s: number, m: any) => s + (Number(m.cost) || 0), 0)
      return [prop.name, propUnits.length, occupied, vacant, formatCurrency(revenue), formatCurrency(manualExp + maintExp)]
    })

    downloadExport(format, {
      headers,
      rows,
      title: t("dashboard.title"),
      filename: "dashboard-summary",
    })
  }

  const handleViewAllRequests = () => {
    router.push("/maintenance")
  }

  const handleViewAllActivity = () => {
    router.push("/tenants/activity")
  }

  return (
    <>
      <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExportFormat} />
      <div className="flex min-h-screen flex-col">
        <DashboardHeader
          showDatePicker={true}
          showExport={true}
          showAddButton={false}
          onExport={handleExportClick}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h2>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t("dashboard.overview")}</TabsTrigger>
              <TabsTrigger value="analytics">{t("dashboard.analytics")}</TabsTrigger>
              <TabsTrigger value="notifications">{t("dashboard.notifications")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <PropertyStats period={selectedPeriod} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>{t("dashboard.financialOverview")}</CardTitle>
                    <CardDescription>{t("dashboard.monthlyRentCollection")}</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2 rtl:pr-2 rtl:pl-0">
                    <Overview period={selectedPeriod} />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
                    <CardDescription>{t("dashboard.latestInvoices")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentInvoices />
                  </CardContent>
                </Card>
              </div>

              {/* Financial Metrics Overview */}
              <FinancialOverview period={selectedPeriod} />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>{t("dashboard.maintenanceRequests")}</CardTitle>
                    <CardDescription>{t("dashboard.recentMaintenance")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MaintenanceRequests />
                  </CardContent>
                  <CardFooter>
                    <InteractiveButton
                      variant="outline"
                      className="w-full"
                      onAction={async () => {
                        router.push("/maintenance")
                      }}
                    >
                      {t("dashboard.viewAllRequests")}
                    </InteractiveButton>
                  </CardFooter>
                </Card>
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>{t("dashboard.tenantActivity")}</CardTitle>
                    <CardDescription>{t("dashboard.recentTenantInteractions")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TenantActivity />
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleViewAllActivity}>
                      {t("dashboard.viewAllActivity")}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              <ModuleCards />
            </TabsContent>

            {/* Other tab contents remain the same */}
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
