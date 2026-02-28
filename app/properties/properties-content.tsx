"use client"

import type React from "react"

import { useState } from "react"
import { Download, MoreHorizontal, Search } from "lucide-react"
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
import { PropertyFilters, type PropertyFilterState } from "@/components/properties/property-filters"
import { AddPropertyDialog } from "@/components/properties/add-property-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties, deleteProperty } from "@/lib/services/properties"

export default function PropertiesContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage, formatNumberWithUnit } = useFormatter()
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState<PropertyFilterState>({
    types: { residential: true, commercial: true, mixed: true },
  })
  const { data: properties, loading, refetch } = useSupabaseQuery(fetchProperties)

  // Filter properties by tab, dropdown filters, and search query
  const filteredProperties = properties.filter((property: any) => {
    // Tab filter
    if (activeTab === "residential" && property.type !== "residential") return false
    if (activeTab === "commercial" && property.type !== "commercial") return false

    // Dropdown type filters (only apply on "all" tab)
    if (activeTab === "all") {
      if (property.type === "residential" && !filters.types.residential) return false
      if (property.type === "commercial" && !filters.types.commercial) return false
      if (property.type === "mixed" && !filters.types.mixed) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = property.name?.toLowerCase().includes(query)
      const matchesAddress = property.address?.toLowerCase().includes(query)
      const matchesCity = property.city?.toLowerCase().includes(query)
      if (!matchesName && !matchesAddress && !matchesCity) return false
    }

    return true
  })

  // Action handlers
  const handleViewDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }

  const handleEditProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}/edit`)
  }

  const handleViewUnits = (propertyId: string) => {
    router.push(`/properties/${propertyId}/units`)
  }

  const handleViewTenants = (propertyId: string) => {
    router.push(`/properties/${propertyId}/tenants`)
  }

  const handleDeleteProperty = async (propertyId: string, propertyName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${propertyName}? This action cannot be undone.`)) return

    try {
      await deleteProperty(propertyId)
      await refetch()
      toast({
        title: t("properties.propertyDeleted"),
        description: `${propertyName} has been successfully deleted.`,
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to delete property. It may have related units, tenants, or contracts.",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    if (filteredProperties.length === 0) {
      toast({
        title: t("common.export"),
        description: "No data to export.",
        variant: "destructive",
      })
      return
    }

    const headers = ["Name", "Address", "City", "State", "Zip", "Type", "Units"]
    const rows = filteredProperties.map((p: any) => [
      p.name,
      p.address,
      p.city,
      p.state,
      p.zip,
      p.type,
      p.units,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "properties.csv"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: t("common.export"),
      description: `Exported ${filteredProperties.length} properties.`,
    })
  }

  const renderTable = () => (
    <Card>
      <CardHeader className="p-4">
        <CardTitle>{t("properties.allProperties")}</CardTitle>
        <CardDescription>{t("properties.manageProperties")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("properties.propertyName")}</TableHead>
              <TableHead>{t("properties.address")}</TableHead>
              <TableHead>{t("properties.type")}</TableHead>
              <TableHead>{t("properties.units")}</TableHead>
              <TableHead>{t("properties.occupancy")}</TableHead>
              <TableHead>{t("properties.monthlyRevenue")}</TableHead>
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
            ) : filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("properties.noProperties")}
                </TableCell>
              </TableRow>
            ) : (
              filteredProperties.map((property: any) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell>{`${property.address}, ${property.city}, ${property.state}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {property.type === "residential" ? t("properties.residential") : property.type === "commercial" ? t("properties.commercial") : t("properties.mixedUse")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNumberWithUnit(property.units, "units")}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-primary" style={{ width: "0%" }}></div>
                      </div>
                      <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(0)}</TableCell>
                  <TableCell className="text-right rtl:text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(property.id)}>
                          {t("properties.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProperty(property.id)}>
                          {t("properties.editProperty")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewUnits(property.id)}>
                          {t("properties.viewUnits")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTenants(property.id)}>
                          {t("properties.viewTenants")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteProperty(property.id, property.name)}
                        >
                          {t("properties.deleteProperty")}
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
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("properties.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddPropertyDialog onSuccess={refetch} />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("properties.allProperties")}</TabsTrigger>
            <TabsTrigger value="residential">{t("properties.residential")}</TabsTrigger>
            <TabsTrigger value="commercial">{t("properties.commercial")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <PropertyFilters filters={filters} onFiltersChange={setFilters} />
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
                placeholder={t("properties.searchProperties")}
                className="h-9 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" size="sm" className="h-9" onClick={() => setSearchQuery("")} disabled={!searchQuery}>
                Clear
              </Button>
            </div>
          </div>
          {renderTable()}
        </div>
      </Tabs>
    </div>
  )
}
