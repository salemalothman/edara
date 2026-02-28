"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties } from "@/lib/services/properties"
import { fetchUnits } from "@/lib/services/units"
import { fetchInvoices } from "@/lib/services/invoices"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"

export function PropertyPerformanceTable() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage } = useFormatter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("totalCollected")
  const [sortOrder, setSortOrder] = useState("desc")

  const { data: properties, loading: l1 } = useSupabaseQuery(fetchProperties)
  const { data: units, loading: l2 } = useSupabaseQuery(fetchUnits)
  const { data: invoices, loading: l3 } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: l4 } = useSupabaseQuery(fetchMaintenanceRequests)

  const loading = l1 || l2 || l3 || l4

  const performanceData = useMemo(() => {
    return properties.map((prop: any) => {
      const propUnits = units.filter((u: any) => u.property_id === prop.id)
      const propInvoices = invoices.filter((inv: any) => inv.property_id === prop.id)
      const propMaint = maintenance.filter((m: any) => m.property_id === prop.id)

      const totalUnits = propUnits.length
      const occupiedUnits = propUnits.filter((u: any) => u.status === "occupied").length
      const occupancyRate = totalUnits > 0 ? occupiedUnits / totalUnits : 0

      const totalCollected = propInvoices
        .filter((i: any) => i.status === "paid")
        .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
      const totalBilled = propInvoices
        .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
      const totalPending = propInvoices
        .filter((i: any) => i.status !== "paid")
        .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)

      const collectionRate = propInvoices.length > 0
        ? propInvoices.filter((i: any) => i.status === "paid").length / propInvoices.length
        : 0

      const maintenanceCount = propMaint.length

      // Simple performance score: weighted average of occupancy, collection, and inverse maintenance
      const score = Math.round(
        (occupancyRate * 40) +
        (collectionRate * 40) +
        (maintenanceCount === 0 ? 20 : Math.max(0, 20 - maintenanceCount * 2))
      )

      return {
        id: prop.id,
        name: prop.name,
        type: prop.type || "—",
        units: totalUnits,
        occupancyRate,
        totalCollected,
        totalPending,
        collectionRate,
        maintenanceCount,
        performanceScore: Math.min(100, Math.max(0, score)),
      }
    })
  }, [properties, units, invoices, maintenance])

  const filteredProperties = performanceData.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedProperties = [...filteredProperties].sort((a: any, b: any) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
    return 0
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const getPerformanceScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{score}</Badge>
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{score}</Badge>
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{score}</Badge>
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{score}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-[250px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
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
            <DropdownMenuItem onClick={() => handleSort("occupancyRate")}>{t("financial.occupancyRate")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("totalCollected")}>Collected Revenue</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("collectionRate")}>Collection Rate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("maintenanceCount")}>Maintenance</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("performanceScore")}>{t("financial.performanceScore")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>{t("financial.propertyName")}</TableHead>
              <TableHead>{t("financial.type")}</TableHead>
              <TableHead>{t("financial.units")}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("occupancyRate")}>{t("financial.occupancyRate")}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("totalCollected")}>Collected</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("totalPending")}>Pending</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("collectionRate")}>Collection %</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("maintenanceCount")}>Maintenance</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("performanceScore")}>{t("financial.performanceScore")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No properties found</TableCell>
              </TableRow>
            ) : (
              sortedProperties.map((property: any) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell className="capitalize">{property.type}</TableCell>
                  <TableCell>{property.units}</TableCell>
                  <TableCell>{formatPercentage(property.occupancyRate)}</TableCell>
                  <TableCell>{formatCurrency(property.totalCollected)}</TableCell>
                  <TableCell>{formatCurrency(property.totalPending)}</TableCell>
                  <TableCell>{formatPercentage(property.collectionRate)}</TableCell>
                  <TableCell>{property.maintenanceCount}</TableCell>
                  <TableCell>{getPerformanceScoreBadge(property.performanceScore)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
