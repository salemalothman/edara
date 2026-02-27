"use client"

import { FileText, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { ReportFilters } from "@/components/reports/report-filters"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useLanguage } from "@/hooks/use-language"

export function ReportsPageClient() {
  const { t } = useLanguage()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <CalendarDateRangePicker />
          <ReportFilters />
        </div>
      </div>
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">{t("reports.financial")}</TabsTrigger>
          <TabsTrigger value="property">{t("reports.property")}</TabsTrigger>
          <TabsTrigger value="tenant">{t("reports.tenant")}</TabsTrigger>
          <TabsTrigger value="maintenance">{t("reports.maintenance")}</TabsTrigger>
          <TabsTrigger value="custom">{t("reports.custom")}</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Income Statement</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">Monthly income and expense summary</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                  {t("reports.generateReport")}
                </Button>
              </CardFooter>
            </Card>
            {/* Other cards */}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.recentReports")}</CardTitle>
              <CardDescription>{t("reports.previouslyGenerated")}</CardDescription>
            </CardHeader>
            <CardContent>{/* Content */}</CardContent>
          </Card>
        </TabsContent>
        {/* Other tab contents */}
      </Tabs>
    </div>
  )
}
