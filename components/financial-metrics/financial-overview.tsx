"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { FinancialMetricsChart } from "@/components/financial-metrics/financial-metrics-chart"
import { FinancialRatios } from "@/components/financial-metrics/financial-ratios"
import { MaintenanceCostBreakdown } from "@/components/financial-metrics/maintenance-cost-breakdown"
import { PropertyPerformanceTable } from "@/components/financial-metrics/property-performance-table"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function FinancialOverview() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({
        title: t("financial.exportSuccess"),
        description: t("financial.exportSuccessDesc"),
      })
    } catch (error) {
      toast({
        title: t("financial.exportError"),
        description: t("financial.exportErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = () => {
    toast({
      title: t("financial.reportGenerating"),
      description: t("financial.reportGeneratingDesc"),
    })

    // Simulate report generation
    setTimeout(() => {
      toast({
        title: t("financial.reportReady"),
        description: t("financial.reportReadyDesc"),
      })
    }, 2000)
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("financial.title")}</CardTitle>
          <CardDescription>{t("financial.description")}</CardDescription>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
            {t("financial.generateReport")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
            {isExporting ? t("financial.exporting") : t("financial.export")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("financial.overview")}</TabsTrigger>
            <TabsTrigger value="ratios">{t("financial.ratios")}</TabsTrigger>
            <TabsTrigger value="maintenance">{t("financial.maintenance")}</TabsTrigger>
            <TabsTrigger value="properties">{t("financial.properties")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <FinancialMetricsChart />
          </TabsContent>

          <TabsContent value="ratios" className="space-y-4">
            <FinancialRatios />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceCostBreakdown />
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <PropertyPerformanceTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
