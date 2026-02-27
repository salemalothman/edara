"use client"

import { Filter, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddInvoiceDialog } from "@/components/invoices/add-invoice-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"

export function InvoicesPageClient() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("invoices.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddInvoiceDialog />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("invoices.allInvoices")}</TabsTrigger>
            <TabsTrigger value="paid">{t("invoices.paid")}</TabsTrigger>
            <TabsTrigger value="pending">{t("invoices.pending")}</TabsTrigger>
            <TabsTrigger value="overdue">{t("invoices.overdue")}</TabsTrigger>
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
              <Input placeholder={t("invoices.searchInvoices")} className="h-9 w-[300px]" />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                {t("common.search")}
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>{t("invoices.allInvoices")}</CardTitle>
              <CardDescription>{t("invoices.manageInvoices")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property/Unit</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
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
