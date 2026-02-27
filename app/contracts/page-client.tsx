"use client"

import { Filter, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"

export function ContractsPageClient() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("contracts.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddContractDialog />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("contracts.allContracts")}</TabsTrigger>
            <TabsTrigger value="active">{t("contracts.active")}</TabsTrigger>
            <TabsTrigger value="pending">{t("contracts.pending")}</TabsTrigger>
            <TabsTrigger value="expiring">{t("contracts.expiring")}</TabsTrigger>
            <TabsTrigger value="expired">{t("contracts.expired")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.filter")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
              <Input placeholder={t("contracts.searchContracts")} className="h-9 w-[300px]" />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                {t("common.search")}
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>{t("contracts.allContracts")}</CardTitle>
              <CardDescription>{t("contracts.manageContracts")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property/Unit</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{/* Table content remains the same */}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
