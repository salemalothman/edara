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

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  const handleAddProperty = () => {
    router.push("/properties/add")
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
              <TabsTrigger value="reports">{t("dashboard.reports")}</TabsTrigger>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Occupancy Rate</CardTitle>
                    <CardDescription>Current property occupancy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold text-primary">87%</div>
                      <p className="text-sm text-muted-foreground mt-2">+2.5% from last month</p>
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
                      <div className="text-5xl font-bold text-primary">92%</div>
                      <p className="text-sm text-muted-foreground mt-2">+4.3% from last month</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Efficiency</CardTitle>
                    <CardDescription>Average resolution time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold text-primary">2.3 days</div>
                      <p className="text-sm text-muted-foreground mt-2">-0.5 days from last month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Year-to-date property performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">Advanced analytics charts would be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Income, expenses, and profit reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Monthly Income Statement</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Quarterly P&L Report</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Annual Financial Summary</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Cash Flow Analysis</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Generate Custom Report
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Property Reports</CardTitle>
                    <CardDescription>Property performance and metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Occupancy Report</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Maintenance Cost Analysis</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Property ROI Calculation</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Tenant Turnover Report</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Generate Custom Report
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Reports</CardTitle>
                    <CardDescription>Tenant activity and payment reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Payment History Report</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Lease Expiration Summary</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between border-b pb-2">
                        <span>Outstanding Balances</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Tenant Communication Log</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Generate Custom Report
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>Recent alerts and system messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 border-l-4 border-blue-500 pl-4 py-2">
                      <div>
                        <p className="font-medium">System Update Scheduled</p>
                        <p className="text-sm text-muted-foreground">
                          Maintenance window scheduled for Sunday, 2:00 AM - 4:00 AM
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 border-l-4 border-yellow-500 pl-4 py-2">
                      <div>
                        <p className="font-medium">Payment Gateway Alert</p>
                        <p className="text-sm text-muted-foreground">
                          Temporary processing delays with Visa transactions
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 border-l-4 border-green-500 pl-4 py-2">
                      <div>
                        <p className="font-medium">New Feature Available</p>
                        <p className="text-sm text-muted-foreground">
                          Document e-signing functionality is now available
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 border-l-4 border-red-500 pl-4 py-2">
                      <div>
                        <p className="font-medium">Security Alert</p>
                        <p className="text-sm text-muted-foreground">
                          Multiple failed login attempts detected for admin account
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View All Notifications
                  </Button>
                </CardFooter>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Notifications</CardTitle>
                    <CardDescription>Recent communications with tenants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4 border-b pb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          JD
                        </div>
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-sm text-muted-foreground">Payment reminder sent via SMS and Email</p>
                          <p className="text-xs text-muted-foreground mt-1">Today, 10:23 AM</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4 border-b pb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          MS
                        </div>
                        <div>
                          <p className="font-medium">Maria Smith</p>
                          <p className="text-sm text-muted-foreground">Maintenance request confirmation sent</p>
                          <p className="text-xs text-muted-foreground mt-1">Yesterday, 3:45 PM</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          RJ
                        </div>
                        <div>
                          <p className="font-medium">Robert Johnson</p>
                          <p className="text-sm text-muted-foreground">Lease renewal notification sent via Email</p>
                          <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure system and tenant notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <h3 className="font-medium">Communication Channels</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" className="justify-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2 h-4 w-4"
                            >
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            Email
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2 h-4 w-4"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            SMS
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2 h-4 w-4"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              <path d="M14 2c1.82.82 3.53 2.2 5 4" />
                              <path d="M14 6c.82.45 1.57 1.05 2.17 1.83" />
                            </svg>
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <h3 className="font-medium">Notification Types</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="justify-start">
                            Payment Reminders
                          </Button>
                          <Button variant="outline" className="justify-start">
                            Maintenance Updates
                          </Button>
                          <Button variant="outline" className="justify-start">
                            Lease Renewals
                          </Button>
                          <Button variant="outline" className="justify-start">
                            System Alerts
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Configure Notifications</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
