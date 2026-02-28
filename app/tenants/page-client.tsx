"use client"

import { useState } from "react"
import { Download, Search, MoreHorizontal, FileText, ExternalLink } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
import { AddContractDialog } from "@/components/contracts/add-contract-dialog"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { useToast } from "@/hooks/use-toast"
import { fetchTenants, updateTenant, deleteTenant } from "@/lib/services/tenants"

export function TenantsPageClient() {
  const { t } = useLanguage()
  const { formatDate, formatCurrency } = useFormatter()
  const { toast } = useToast()
  const { data: tenants, loading, refetch } = useSupabaseQuery(fetchTenants)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Get the most recent (active) contract for a tenant
  const getActiveContract = (tenant: any) => {
    if (!tenant.contracts || tenant.contracts.length === 0) return null
    // Sort by end_date desc, pick the latest
    const sorted = [...tenant.contracts].sort(
      (a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    )
    return sorted[0]
  }

  const filteredTenants = tenants.filter((tenant: any) => {
    const status = tenant.status || "active"
    if (activeTab !== "all" && status !== activeTab) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const name = `${tenant.first_name} ${tenant.last_name}`.toLowerCase()
      const email = (tenant.email || "").toLowerCase()
      const property = (tenant.property?.name || "").toLowerCase()
      const unit = (tenant.unit?.name || "").toLowerCase()
      if (!name.includes(query) && !email.includes(query) && !property.includes(query) && !unit.includes(query)) {
        return false
      }
    }

    return true
  })

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      await updateTenant(tenantId, { status: newStatus })
      refetch()
      toast({ title: "Success", description: `Tenant marked as ${newStatus}` })
    } catch {
      toast({ title: "Error", description: "Failed to update tenant status", variant: "destructive" })
    }
  }

  const handleDelete = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to remove this tenant?")) return
    try {
      await deleteTenant(tenantId)
      refetch()
      toast({ title: "Success", description: "Tenant removed successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to remove tenant", variant: "destructive" })
    }
  }

  const handleExport = () => {
    const headers = ["Name", "Property", "Unit", "Email", "Phone", "Status", "Move-in Date", "Lease End", "Contract ID", "Rent"]
    const rows = filteredTenants.map((tenant: any) => {
      const contract = getActiveContract(tenant)
      return [
        `${tenant.first_name} ${tenant.last_name}`,
        tenant.property?.name || "",
        tenant.unit?.name || "",
        tenant.email || "",
        tenant.phone || "",
        tenant.status || "active",
        tenant.move_in_date || "",
        tenant.lease_end_date || "",
        contract?.contract_id || "",
        contract?.rent_amount || "",
      ]
    })
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tenants.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "former": return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default: return "bg-green-100 text-green-800 hover:bg-green-100"
    }
  }

  const contractStatusBadge = (contract: any) => {
    if (!contract) return null
    const endDate = new Date(contract.end_date)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (endDate < now) return "bg-red-100 text-red-800 hover:bg-red-100"
    if (endDate < thirtyDaysFromNow) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    return "bg-green-100 text-green-800 hover:bg-green-100"
  }

  const contractStatusLabel = (contract: any) => {
    if (!contract) return null
    const endDate = new Date(contract.end_date)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (endDate < now) return "Expired"
    if (endDate < thirtyDaysFromNow) return "Expiring Soon"
    return "Active"
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("tenants.title")} & {t("common.contracts")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddContractDialog onSuccess={refetch} />
          <AddTenantDialog onSuccess={refetch} />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("tenants.allTenants")}</TabsTrigger>
            <TabsTrigger value="active">{t("tenants.active")}</TabsTrigger>
            <TabsTrigger value="pending">{t("tenants.pending")}</TabsTrigger>
            <TabsTrigger value="former">{t("tenants.former")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
              <Input
                placeholder={t("tenants.searchTenants")}
                className="h-9 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                {t("common.search")}
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>
                {activeTab === "all" ? t("tenants.allTenants") :
                 activeTab === "active" ? t("tenants.active") :
                 activeTab === "pending" ? t("tenants.pending") :
                 t("tenants.former")} {t("tenants.title")}
              </CardTitle>
              <CardDescription>{t("tenants.manageTenants")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tenants.name")}</TableHead>
                    <TableHead>{t("tenants.propertyUnit")}</TableHead>
                    <TableHead>{t("tenants.contact")}</TableHead>
                    <TableHead>{t("tenants.leaseStatus")}</TableHead>
                    <TableHead>{t("tenants.moveInDate")}</TableHead>
                    <TableHead>{t("common.contracts")}</TableHead>
                    <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No tenants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((tenant: any) => {
                      const status = tenant.status || "active"
                      const contract = getActiveContract(tenant)
                      return (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{`${tenant.first_name} ${tenant.last_name}`}</TableCell>
                          <TableCell>
                            {tenant.property?.name || "—"}
                            {tenant.unit?.name ? `, ${tenant.unit.name}` : ""}
                          </TableCell>
                          <TableCell>{tenant.email}</TableCell>
                          <TableCell>
                            <Badge className={statusBadge(status)}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>{tenant.move_in_date ? formatDate(new Date(tenant.move_in_date)) : "—"}</TableCell>
                          <TableCell>
                            {contract ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Badge className={contractStatusBadge(contract)}>
                                    {contractStatusLabel(contract)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {contract.contract_id} &middot; {formatCurrency(Number(contract.rent_amount))}/mo
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(new Date(contract.start_date))} — {formatDate(new Date(contract.end_date))}
                                </span>
                                {contract.file_url && (
                                  <a
                                    href={contract.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                                  >
                                    <FileText className="h-3 w-3" />
                                    View Contract
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No contract</span>
                            )}
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
                                {contract?.file_url && (
                                  <DropdownMenuItem onClick={() => window.open(contract.file_url, "_blank")}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Contract PDF
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                  Change Status
                                </DropdownMenuLabel>
                                {status !== "active" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, "active")}>
                                    Mark as Active
                                  </DropdownMenuItem>
                                )}
                                {status !== "pending" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, "pending")}>
                                    Mark as Pending
                                  </DropdownMenuItem>
                                )}
                                {status !== "former" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, "former")}>
                                    Mark as Former
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(tenant.id)}
                                >
                                  Remove tenant
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}
