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
import { Skeleton } from "@/components/ui/skeleton"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchContracts } from "@/lib/services/contracts"

export default function ContractsContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()
  const { data: contracts, loading, refetch } = useSupabaseQuery(fetchContracts)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("common.contracts")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddContractDialog onSuccess={refetch} />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All Contracts</TabsTrigger>
            <TabsTrigger value="active">{t("status.active")}</TabsTrigger>
            <TabsTrigger value="pending">Pending Signature</TabsTrigger>
            <TabsTrigger value="expiring">{t("status.expiringSoon")}</TabsTrigger>
            <TabsTrigger value="expired">{t("status.expired")}</TabsTrigger>
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
              <Input placeholder="Search contracts..." className="h-9 w-[300px]" />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Contracts</CardTitle>
              <CardDescription>Manage your lease agreements and contracts</CardDescription>
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
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No contracts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((contract: any) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_id}</TableCell>
                        <TableCell>
                          {contract.tenant ? `${contract.tenant.first_name} ${contract.tenant.last_name}` : "—"}
                        </TableCell>
                        <TableCell>
                          {contract.property?.name || "—"}
                          {contract.unit?.name ? `, ${contract.unit.name}` : ""}
                        </TableCell>
                        <TableCell>{formatDate(new Date(contract.start_date))}</TableCell>
                        <TableCell>{formatDate(new Date(contract.end_date))}</TableCell>
                        <TableCell>{formatCurrency(Number(contract.rent_amount))}</TableCell>
                        <TableCell>
                          <Badge className={
                            contract.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            contract.status === "expiring_soon" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                            contract.status === "expired" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }>
                            {contract.status === "active" ? t("status.active") :
                             contract.status === "expiring_soon" ? t("status.expiringSoon") :
                             contract.status === "expired" ? t("status.expired") :
                             contract.status || "active"}
                          </Badge>
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
                              <DropdownMenuItem>View contract</DropdownMenuItem>
                              <DropdownMenuItem>Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit contract</DropdownMenuItem>
                              <DropdownMenuItem>Renew contract</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Terminate contract</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
