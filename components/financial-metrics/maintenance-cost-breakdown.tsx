"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const categoryColors: Record<string, string> = {
  plumbing: "#3B82F6",
  electrical: "#F43F5E",
  hvac: "#22C55E",
  structural: "#8B5CF6",
  appliance: "#FBBF24",
  landscaping: "#60A5FA",
  "pest control": "#FB7185",
  cleaning: "#94A3B8",
  general: "#6366F1",
  other: "#94A3B8",
}

export function MaintenanceCostBreakdown() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()
  const [view, setView] = useState("breakdown")
  const { theme } = useTheme()

  const { data: maintenance, loading } = useSupabaseQuery(fetchMaintenanceRequests)

  // Group by category
  const categoryMap: Record<string, { count: number }> = {}
  for (const req of maintenance) {
    const cat = (req.category || "general").toLowerCase()
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0 }
    categoryMap[cat].count++
  }

  const categoryData = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)

  const totalCount = maintenance.length
  const completedCount = maintenance.filter((m: any) => m.status === "completed").length
  const pendingCount = maintenance.filter((m: any) => m.status === "pending" || m.status === "assigned" || m.status === "in_progress").length

  // Monthly trend
  const now = new Date()
  const trendData = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().substring(0, 7)
    const label = MONTHS[d.getMonth()]
    const count = maintenance.filter((m: any) => m.created_at?.substring(0, 7) === key).length
    trendData.push({ month: label, count })
  }

  // Recent requests
  const recentRequests = maintenance.slice(0, 8)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("maintenance.completed")}</Badge>
      case "in_progress": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t("maintenance.inProgress")}</Badge>
      case "assigned": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{t("maintenance.assigned")}</Badge>
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("maintenance.pending")}</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardHeader className="p-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-16 mt-1" /></CardHeader></Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.totalRequests")}</CardDescription>
              <CardTitle className="text-xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-xl text-green-600">{completedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>Open</CardDescription>
              <CardTitle className="text-xl text-yellow-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Tabs value={view} onValueChange={setView} className="w-auto">
          <TabsList>
            <TabsTrigger value="breakdown">{t("financial.breakdown")}</TabsTrigger>
            <TabsTrigger value="trend">{t("financial.trend")}</TabsTrigger>
            <TabsTrigger value="recent">{t("financial.recent")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "breakdown" && (
        <div className="h-[400px]">
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No maintenance data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value} requests`} />
                <Legend />
                <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={categoryColors[entry.category.toLowerCase()] || "#8884d8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {view === "trend" && (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} requests`} />
              <Legend />
              <Bar
                dataKey="count"
                name="Maintenance Requests"
                fill={theme === "dark" ? "#60A5FA" : "#3B82F6"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === "recent" && (
        <div className="rounded-md border">
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No maintenance requests</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("financial.property")}</TableHead>
                  <TableHead>{t("financial.category")}</TableHead>
                  <TableHead>{t("financial.description")}</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>{t("financial.date")}</TableHead>
                  <TableHead>{t("financial.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.property?.name || "—"}</TableCell>
                    <TableCell>{req.category || "—"}</TableCell>
                    <TableCell>{req.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{req.priority || "medium"}</Badge>
                    </TableCell>
                    <TableCell>{req.created_at ? formatDate(new Date(req.created_at)) : "—"}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
