"use client"

import { Filter, Download, MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AddInvoiceDialog } from "@/components/invoices/add-invoice-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"

export default function InvoicesContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("common.invoices")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddInvoiceDialog />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="paid">{t("status.paid")}</TabsTrigger>
            <TabsTrigger value="pending">{t("status.pending")}</TabsTrigger>
            <TabsTrigger value="overdue">{t("status.overdue")}</TabsTrigger>
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
              <Input placeholder="Search invoices..." className="h-9 w-[300px]" />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Manage your invoices and payment records</CardDescription>
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
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV-2023-0125</TableCell>
                    <TableCell>John Doe</TableCell>
                    <TableCell>Sunset Towers, Apt 301</TableCell>
                    <TableCell>{formatDate(new Date("2023-06-01"))}</TableCell>
                    <TableCell>{formatDate(new Date("2023-06-15"))}</TableCell>
                    <TableCell>{formatCurrency(1250)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("status.paid")}</Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>View invoice</DropdownMenuItem>
                          <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send to tenant</DropdownMenuItem>
                          <DropdownMenuItem>View payment</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV-2023-0126</TableCell>
                    <TableCell>Maria Smith</TableCell>
                    <TableCell>Ocean View Apartments, Unit 205</TableCell>
                    <TableCell>{formatDate(new Date("2023-06-01"))}</TableCell>
                    <TableCell>{formatDate(new Date("2023-06-15"))}</TableCell>
                    <TableCell>{formatCurrency(950)}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("status.pending")}</Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>View invoice</DropdownMenuItem>
                          <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send reminder</DropdownMenuItem>
                          <DropdownMenuItem>Mark as paid</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV-2023-0110</TableCell>
                    <TableCell>Robert Johnson</TableCell>
                    <TableCell>Parkside Residences, Villa 12</TableCell>
                    <TableCell>{formatDate(new Date("2023-05-01"))}</TableCell>
                    <TableCell>{formatDate(new Date("2023-05-15"))}</TableCell>
                    <TableCell>{formatCurrency(1800)}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("status.overdue")}</Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>View invoice</DropdownMenuItem>
                          <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send reminder</DropdownMenuItem>
                          <DropdownMenuItem>Mark as paid</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Apply late fee</DropdownMenuItem>
                          <DropdownMenuItem>Edit invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
