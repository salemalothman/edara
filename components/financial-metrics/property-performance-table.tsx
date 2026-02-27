"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Search } from "lucide-react"
import { useState } from "react"

// Mock property performance data
const propertyPerformanceData = [
  {
    id: "prop-1",
    name: "Sunset Towers",
    type: "Residential",
    units: 24,
    occupancyRate: 0.92,
    monthlyRevenue: 42500,
    monthlyExpenses: 15200,
    noi: 27300,
    capRate: 0.068,
    roi: 0.072,
    maintenanceCost: 5800,
    maintenanceRatio: 0.136,
    performanceScore: 85,
  },
  {
    id: "prop-2",
    name: "Ocean View Apartments",
    type: "Residential",
    units: 18,
    occupancyRate: 0.83,
    monthlyRevenue: 36200,
    monthlyExpenses: 13800,
    noi: 22400,
    capRate: 0.065,
    roi: 0.069,
    maintenanceCost: 4900,
    maintenanceRatio: 0.135,
    performanceScore: 82,
  },
  {
    id: "prop-3",
    name: "Downtown Business Center",
    type: "Commercial",
    units: 12,
    occupancyRate: 0.75,
    monthlyRevenue: 28800,
    monthlyExpenses: 10200,
    noi: 18600,
    capRate: 0.078,
    roi: 0.082,
    maintenanceCost: 3200,
    maintenanceRatio: 0.111,
    performanceScore: 79,
  },
  {
    id: "prop-4",
    name: "Parkside Residences",
    type: "Residential",
    units: 32,
    occupancyRate: 0.88,
    monthlyRevenue: 52800,
    monthlyExpenses: 19500,
    noi: 33300,
    capRate: 0.071,
    roi: 0.075,
    maintenanceCost: 7200,
    maintenanceRatio: 0.136,
    performanceScore: 87,
  },
  {
    id: "prop-5",
    name: "Retail Plaza",
    type: "Commercial",
    units: 8,
    occupancyRate: 1.0,
    monthlyRevenue: 32000,
    monthlyExpenses: 11800,
    noi: 20200,
    capRate: 0.081,
    roi: 0.085,
    maintenanceCost: 2800,
    maintenanceRatio: 0.088,
    performanceScore: 92,
  },
]

export function PropertyPerformanceTable() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage } = useFormatter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("performanceScore")
  const [sortOrder, setSortOrder] = useState("desc")

  // Filter properties based on search query
  const filteredProperties = propertyPerformanceData.filter(
    (property) =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a]
    const bValue = b[sortBy as keyof typeof b]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  // Get performance score badge
  const getPerformanceScoreBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{score}</Badge>
    } else if (score >= 80) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{score}</Badge>
    } else if (score >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{score}</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{score}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Input
            placeholder={t("financial.searchProperties")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {t("financial.sortBy")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSort("name")}>{t("financial.propertyName")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("occupancyRate")}>
              {t("financial.occupancyRate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("monthlyRevenue")}>
              {t("financial.monthlyRevenue")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("noi")}>{t("financial.noi")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("capRate")}>{t("financial.capRate")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("roi")}>{t("financial.roi")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("maintenanceRatio")}>
              {t("financial.maintenanceRatio")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("performanceScore")}>
              {t("financial.performanceScore")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={sortBy === "name" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("name")}
              >
                {t("financial.propertyName")}
              </TableHead>
              <TableHead>{t("financial.type")}</TableHead>
              <TableHead>{t("financial.units")}</TableHead>
              <TableHead
                className={sortBy === "occupancyRate" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("occupancyRate")}
              >
                {t("financial.occupancyRate")}
              </TableHead>
              <TableHead
                className={sortBy === "monthlyRevenue" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("monthlyRevenue")}
              >
                {t("financial.monthlyRevenue")}
              </TableHead>
              <TableHead
                className={sortBy === "noi" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("noi")}
              >
                {t("financial.noi")}
              </TableHead>
              <TableHead
                className={sortBy === "capRate" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("capRate")}
              >
                {t("financial.capRate")}
              </TableHead>
              <TableHead
                className={sortBy === "roi" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("roi")}
              >
                {t("financial.roi")}
              </TableHead>
              <TableHead
                className={sortBy === "maintenanceRatio" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("maintenanceRatio")}
              >
                {t("financial.maintenanceRatio")}
              </TableHead>
              <TableHead
                className={sortBy === "performanceScore" ? "cursor-pointer text-primary" : "cursor-pointer"}
                onClick={() => handleSort("performanceScore")}
              >
                {t("financial.performanceScore")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell>{property.type}</TableCell>
                <TableCell>{property.units}</TableCell>
                <TableCell>{formatPercentage(property.occupancyRate)}</TableCell>
                <TableCell>{formatCurrency(property.monthlyRevenue)}</TableCell>
                <TableCell>{formatCurrency(property.noi)}</TableCell>
                <TableCell>{formatPercentage(property.capRate)}</TableCell>
                <TableCell>{formatPercentage(property.roi)}</TableCell>
                <TableCell>{formatPercentage(property.maintenanceRatio)}</TableCell>
                <TableCell>{getPerformanceScoreBadge(property.performanceScore)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
