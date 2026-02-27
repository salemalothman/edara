"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { ActionMenu, type ActionItem, type ActionGroup } from "@/components/ui/action-menu"
import { ExportButton } from "@/components/ui/export-button"
import { useToast } from "@/hooks/use-toast"

interface Property {
  id: string
  name: string
  address: string
  type: string
  units: number
  occupancyRate: number
  monthlyRevenue: number
}

interface PropertyTableProps {
  properties?: Property[]
  onSearch?: (query: string) => void
  onFilter?: () => void
  onExport?: () => Promise<void>
}

export function PropertyTable({ properties = [], onSearch, onFilter, onExport }: PropertyTableProps) {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage, formatNumberWithUnit } = useFormatter()
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Default properties if none provided
  const defaultProperties: Property[] = [
    {
      id: "sunset-towers",
      name: "Sunset Towers",
      address: "123 Main St, City, State",
      type: "residential",
      units: 24,
      occupancyRate: 0.92,
      monthlyRevenue: 42500,
    },
    {
      id: "ocean-view",
      name: "Ocean View Apartments",
      address: "456 Beach Rd, Coastal City, State",
      type: "residential",
      units: 18,
      occupancyRate: 0.83,
      monthlyRevenue: 36200,
    },
    {
      id: "downtown-business",
      name: "Downtown Business Center",
      address: "789 Commerce Ave, Metro City, State",
      type: "commercial",
      units: 12,
      occupancyRate: 0.75,
      monthlyRevenue: 28800,
    },
    {
      id: "parkside",
      name: "Parkside Residences",
      address: "321 Park Lane, Green City, State",
      type: "residential",
      units: 32,
      occupancyRate: 0.88,
      monthlyRevenue: 52800,
    },
    {
      id: "retail-plaza",
      name: "Retail Plaza",
      address: "555 Shopping Blvd, Market City, State",
      type: "commercial",
      units: 8,
      occupancyRate: 1.0,
      monthlyRevenue: 32000,
    },
  ]

  const displayProperties = properties.length > 0 ? properties : defaultProperties

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

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    if (window.confirm(`Are you sure you want to delete ${propertyName}? This action cannot be undone.`)) {
      // Simulate API call
      setTimeout(() => {
        toast({
          title: "Property Deleted",
          description: `${propertyName} has been successfully deleted.`,
        })
      }, 500)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      toast({
        title: "Search Results",
        description: `Showing results for "${searchQuery}"`,
      })
    }
  }

  // Generate action menu items for each property
  const getPropertyActions = (property: Property): ActionGroup[] => [
    {
      label: t("common.actions"),
      items: [
        {
          label: t("properties.viewDetails"),
          onClick: () => handleViewDetails(property.id),
        },
        {
          label: t("properties.editProperty"),
          onClick: () => handleEditProperty(property.id),
        },
        { separator: true } as ActionItem,
      ],
    },
    {
      items: [
        {
          label: t("properties.viewUnits"),
          onClick: () => handleViewUnits(property.id),
        },
        {
          label: t("properties.viewTenants"),
          onClick: () => handleViewTenants(property.id),
        },
        { separator: true } as ActionItem,
      ],
    },
    {
      items: [
        {
          label: t("properties.deleteProperty"),
          onClick: () => handleDeleteProperty(property.id, property.name),
          variant: "destructive",
        },
      ],
    },
  ]

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle>{t("properties.allProperties")}</CardTitle>
        <CardDescription>{t("properties.manageProperties")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
            <Input
              placeholder={t("properties.searchProperties")}
              className="h-9 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline" size="sm" className="h-9" type="submit">
              <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.filter")}
            </Button>
            <div className="ml-auto">
              <ExportButton onExport={onExport} />
            </div>
          </form>
        </div>
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
            {displayProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell>{property.address}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`properties.${property.type}`)}</Badge>
                </TableCell>
                <TableCell>{formatNumberWithUnit(property.units, "units")}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${property.occupancyRate * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(property.occupancyRate)}</span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(property.monthlyRevenue)}</TableCell>
                <TableCell className="text-right rtl:text-left">
                  <ActionMenu actions={getPropertyActions(property)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
