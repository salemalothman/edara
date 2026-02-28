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
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { FinancialOverview } from "@/components/financial-metrics/financial-overview"
import { DashboardHeader } from "@/components/dashboard-header"
import { InteractiveButton } from "@/components/ui/interactive-button"
import { FeatureHighlights } from "@/components/feature-highlights"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchUnits } from "@/lib/services/units"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsTab } from "@/components/notifications/notifications-tab"

function AnalyticsTab() {
  const { data: units, loading: loadingUnits } = useSupabaseQuery(fetchUnits)
  const { data: invoices, loading: loadingInv } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: loadingMaint } = useSupabaseQuery(fetchMaintenanceRequests)

  const loading = loadingUnits || loadingInv || loadingMaint

  const totalUnits = units.length
  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length
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
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Current property occupancy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{occupancyRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">{occupiedUnits} of {totalUnits} units occupied</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
            <CardDescription>Rent collection efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{collectionRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">{paidInvoices} of {totalInvoices} invoices paid</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>Request status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {loading ? <Skeleton className="h-12 w-20 mx-auto" /> : (
                <>
                  <div className="text-5xl font-bold text-primary">{maintenance.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">{completedMaint} completed, {pendingMaint} open</p>
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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  const handleAddProperty = () => {
    router.push("/properties")
  }

  const handleExport = async () => {
    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return Promise.resolve()
  }

  const handleViewAllRequests = () => {
    router.push("/maintenance")
  }

  const handleViewAllActivity = () => {
    router.push("/tenants/activity")
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader
          showDatePicker={true}
          showExport={true}
          showAddButton={true}
          addButtonLabel={t("properties.addProperty")}
          onAddButtonClick={handleAddProperty}
          onExport={handleExport}
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
              <PropertyStats />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>{t("dashboard.financialOverview")}</CardTitle>
                    <CardDescription>{t("dashboard.monthlyRentCollection")}</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2 rtl:pr-2 rtl:pl-0">
                    <Overview />
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
              <FinancialOverview />

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
              <FeatureHighlights />
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
