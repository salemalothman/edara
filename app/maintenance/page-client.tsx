"use client"

import { useState } from "react"
import { Filter, Download, Search, MoreHorizontal } from "lucide-react"
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
import { AddMaintenanceRequestDialog } from "@/components/maintenance/add-maintenance-request-dialog"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useToast } from "@/hooks/use-toast"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchMaintenanceRequests, updateMaintenanceRequest, deleteMaintenanceRequest } from "@/lib/services/maintenance"

export function MaintenancePageClient() {
  const { t } = useLanguage()
  const { formatDate } = useFormatter()
  const { toast } = useToast()
  const { data: requests, loading, error, refetch } = useSupabaseQuery(fetchMaintenanceRequests)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-100"
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "low": return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 hover:bg-green-100"
      case "in_progress": return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "assigned": return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed": return t("maintenance.completed")
      case "in_progress": return t("maintenance.inProgress")
      case "assigned": return t("maintenance.assigned")
      case "pending": return t("maintenance.pending")
      default: return status?.replace("_", " ") || "pending"
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateMaintenanceRequest(id, { status: newStatus })
      refetch()
      toast({ title: t("common.success") || "Success", description: `Status updated to ${newStatus.replace("_", " ")}` })
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: err?.message || "Failed to update status", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("dashboard.confirmDeleteMaintenance"))) return
    try {
      await deleteMaintenanceRequest(id)
      refetch()
      toast({ title: t("common.success") || "Success", description: "Maintenance request deleted" })
    } catch (err: any) {
      toast({ title: t("common.error") || "Error", description: err?.message || "Failed to delete", variant: "destructive" })
    }
  }

  const handleExportFormat = (format: ExportFormat) => {
    const headers = [t("dashboard.propertyUnit"), t("dashboard.issue"), t("maintenance.category"), t("dashboard.reportedDate"), t("maintenance.priority"), t("common.status")]
    const rows = filteredRequests.map((r: any) => [
      `${r.property?.name || "—"}${r.unit?.name ? `, ${r.unit.name}` : ""}`,
      r.title,
      r.category,
      r.created_at ? formatDate(new Date(r.created_at)) : "",
      r.priority,
      r.status?.replace("_", " ") || "pending",
    ])

    downloadExport(format, {
      headers,
      rows,
      title: t("common.maintenance"),
      filename: "maintenance-requests",
    })
  }

  // Filter by tab
  const tabFiltered = requests.filter((r: any) => {
    if (activeTab === "all") return true
    if (activeTab === "in-progress") return r.status === "in_progress"
    return r.status === activeTab
  })

  // Filter by search
  const filteredRequests = tabFiltered.filter((r: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.property?.name?.toLowerCase().includes(q) ||
      r.unit?.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    )
  })

  const renderTable = () => (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
          <Input
            placeholder={t("maintenance.searchRequests") || "Search requests..."}
            className="h-9 w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Card>
        <CardHeader className="p-4">
          <CardTitle>
            {activeTab === "all" ? t("maintenance.allRequests") : statusLabel(activeTab === "in-progress" ? "in_progress" : activeTab)}
          </CardTitle>
          <CardDescription>{t("maintenance.manageRequests")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.propertyUnit")}</TableHead>
                <TableHead>{t("dashboard.issue")}</TableHead>
                <TableHead>{t("maintenance.category")}</TableHead>
                <TableHead>{t("dashboard.reportedDate")}</TableHead>
                <TableHead>{t("maintenance.priority")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-600">
                    {t("dashboard.errorLoadingRequests")}: {error}
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("dashboard.noMaintenanceRequests")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.property?.name || "—"}
                      {request.unit?.name ? `, ${request.unit.name}` : ""}
                    </TableCell>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>{request.category}</TableCell>
                    <TableCell>{formatDate(new Date(request.created_at))}</TableCell>
                    <TableCell>
                      <Badge className={priorityBadge(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge(request.status)}>
                        {statusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("dashboard.openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t("dashboard.changeStatus")}</DropdownMenuLabel>
                          {request.status !== "pending" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(request.id, "pending")}>
                              {t("maintenance.pending")}
                            </DropdownMenuItem>
                          )}
                          {request.status !== "assigned" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(request.id, "assigned")}>
                              {t("maintenance.assigned")}
                            </DropdownMenuItem>
                          )}
                          {request.status !== "in_progress" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(request.id, "in_progress")}>
                              {t("maintenance.inProgress")}
                            </DropdownMenuItem>
                          )}
                          {request.status !== "completed" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(request.id, "completed")}>
                              {t("maintenance.completed")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(request.id)}
                          >
                            {t("common.delete")}
                          </DropdownMenuItem>
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
    </>
  )

  return (
    <>
    <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExportFormat} />
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("maintenance.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddMaintenanceRequestDialog onSuccess={refetch} />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("maintenance.allRequests")}</TabsTrigger>
            <TabsTrigger value="pending">{t("maintenance.pending")}</TabsTrigger>
            <TabsTrigger value="assigned">{t("maintenance.assigned")}</TabsTrigger>
            <TabsTrigger value="in-progress">{t("maintenance.inProgress")}</TabsTrigger>
            <TabsTrigger value="completed">{t("maintenance.completed")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="pending" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="assigned" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="in-progress" className="space-y-4">{renderTable()}</TabsContent>
        <TabsContent value="completed" className="space-y-4">{renderTable()}</TabsContent>
      </Tabs>
    </div>
    </>
  )
}
