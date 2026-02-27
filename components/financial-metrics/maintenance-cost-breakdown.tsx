"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useTheme } from "next-themes"

// Mock maintenance cost data
const maintenanceCostData = {
  monthly: [
    { category: "Plumbing", cost: 2800, count: 12, avgCost: 233 },
    { category: "Electrical", cost: 2100, count: 8, avgCost: 262 },
    { category: "HVAC", cost: 3500, count: 5, avgCost: 700 },
    { category: "Structural", cost: 1200, count: 2, avgCost: 600 },
    { category: "Appliance", cost: 1800, count: 7, avgCost: 257 },
    { category: "Landscaping", cost: 1500, count: 4, avgCost: 375 },
    { category: "Pest Control", cost: 900, count: 6, avgCost: 150 },
    { category: "Cleaning", cost: 1100, count: 9, avgCost: 122 },
  ],
  quarterly: [
    { category: "Plumbing", cost: 8400, count: 36, avgCost: 233 },
    { category: "Electrical", cost: 6300, count: 24, avgCost: 262 },
    { category: "HVAC", cost: 10500, count: 15, avgCost: 700 },
    { category: "Structural", cost: 3600, count: 6, avgCost: 600 },
    { category: "Appliance", cost: 5400, count: 21, avgCost: 257 },
    { category: "Landscaping", cost: 4500, count: 12, avgCost: 375 },
    { category: "Pest Control", cost: 2700, count: 18, avgCost: 150 },
    { category: "Cleaning", cost: 3300, count: 27, avgCost: 122 },
  ],
  yearly: [
    { category: "Plumbing", cost: 33600, count: 144, avgCost: 233 },
    { category: "Electrical", cost: 25200, count: 96, avgCost: 262 },
    { category: "HVAC", cost: 42000, count: 60, avgCost: 700 },
    { category: "Structural", cost: 14400, count: 24, avgCost: 600 },
    { category: "Appliance", cost: 21600, count: 84, avgCost: 257 },
    { category: "Landscaping", cost: 18000, count: 48, avgCost: 375 },
    { category: "Pest Control", cost: 10800, count: 72, avgCost: 150 },
    { category: "Cleaning", cost: 13200, count: 108, avgCost: 122 },
  ],
}

// Recent maintenance expenses
const recentMaintenanceExpenses = [
  {
    id: "M-2893",
    property: "Sunset Towers",
    unit: "Apt 301",
    category: "Plumbing",
    description: "Leaky faucet repair",
    cost: 180,
    date: "2023-12-01",
    status: "completed",
  },
  {
    id: "M-2894",
    property: "Ocean View Apartments",
    unit: "Unit 205",
    category: "Electrical",
    description: "Outlet replacement",
    cost: 150,
    date: "2023-12-02",
    status: "completed",
  },
  {
    id: "M-2895",
    property: "Parkside Residences",
    unit: "Villa 12",
    category: "HVAC",
    description: "AC maintenance",
    cost: 350,
    date: "2023-12-03",
    status: "completed",
  },
  {
    id: "M-2896",
    property: "Downtown Business Center",
    unit: "Office 405",
    category: "Structural",
    description: "Door repair",
    cost: 220,
    date: "2023-12-04",
    status: "completed",
  },
  {
    id: "M-2897",
    property: "Sunset Towers",
    unit: "Apt 302",
    category: "Appliance",
    description: "Refrigerator repair",
    cost: 275,
    date: "2023-12-05",
    status: "completed",
  },
  {
    id: "M-2898",
    property: "Retail Plaza",
    unit: "Shop 3",
    category: "Plumbing",
    description: "Toilet replacement",
    cost: 420,
    date: "2023-12-06",
    status: "in-progress",
  },
  {
    id: "M-2899",
    property: "Ocean View Apartments",
    unit: "Unit 210",
    category: "Electrical",
    description: "Light fixture installation",
    cost: 190,
    date: "2023-12-07",
    status: "in-progress",
  },
  {
    id: "M-2900",
    property: "Parkside Residences",
    unit: "Villa 15",
    category: "Landscaping",
    description: "Tree trimming",
    cost: 300,
    date: "2023-12-08",
    status: "pending",
  },
]

// Maintenance cost trend data
const maintenanceTrendData = [
  { month: "Jan", cost: 12500 },
  { month: "Feb", cost: 11800 },
  { month: "Mar", cost: 13200 },
  { month: "Apr", cost: 12900 },
  { month: "May", cost: 14500 },
  { month: "Jun", cost: 15200 },
  { month: "Jul", cost: 16800 },
  { month: "Aug", cost: 17500 },
  { month: "Sep", cost: 16200 },
  { month: "Oct", cost: 15800 },
  { month: "Nov", cost: 14900 },
  { month: "Dec", cost: 15300 },
]

// Category colors
const categoryColors = {
  Plumbing: "#3B82F6", // Blue
  Electrical: "#F43F5E", // Red
  HVAC: "#22C55E", // Green
  Structural: "#8B5CF6", // Purple
  Appliance: "#FBBF24", // Yellow
  Landscaping: "#60A5FA", // Light Blue
  "Pest Control": "#FB7185", // Light Red
  Cleaning: "#94A3B8", // Gray
}

export function MaintenanceCostBreakdown() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const [timeRange, setTimeRange] = useState("monthly")
  const [view, setView] = useState("breakdown")
  const { theme } = useTheme()

  const data = maintenanceCostData[timeRange as keyof typeof maintenanceCostData]

  // Calculate totals
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0)
  const totalCount = data.reduce((sum, item) => sum + item.count, 0)
  const avgCostPerRequest = totalCost / totalCount

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("maintenance.completed")}</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t("maintenance.inProgress")}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("maintenance.pending")}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.totalMaintenanceCost")}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(totalCost)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.totalRequests")}</CardDescription>
              <CardTitle className="text-xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardDescription>{t("financial.avgCostPerRequest")}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(avgCostPerRequest)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
            <TabsList>
              <TabsTrigger value="monthly">{t("financial.monthly")}</TabsTrigger>
              <TabsTrigger value="quarterly">{t("financial.quarterly")}</TabsTrigger>
              <TabsTrigger value="yearly">{t("financial.yearly")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={setView} className="w-auto">
            <TabsList>
              <TabsTrigger value="breakdown">{t("financial.breakdown")}</TabsTrigger>
              <TabsTrigger value="trend">{t("financial.trend")}</TabsTrigger>
              <TabsTrigger value="recent">{t("financial.recent")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "breakdown" && (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => label} />
              <Legend />
              <Bar dataKey="cost" name={t("financial.totalCost")} radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[entry.category as keyof typeof categoryColors] || "#8884d8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === "trend" && (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar
                dataKey="cost"
                name={t("financial.maintenanceCost")}
                fill={theme === "dark" ? "#60A5FA" : "#3B82F6"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === "recent" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("financial.requestId")}</TableHead>
                <TableHead>{t("financial.property")}</TableHead>
                <TableHead>{t("financial.unit")}</TableHead>
                <TableHead>{t("financial.category")}</TableHead>
                <TableHead>{t("financial.description")}</TableHead>
                <TableHead>{t("financial.cost")}</TableHead>
                <TableHead>{t("financial.date")}</TableHead>
                <TableHead>{t("financial.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMaintenanceExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>{expense.property}</TableCell>
                  <TableCell>{expense.unit}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{formatCurrency(expense.cost)}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
